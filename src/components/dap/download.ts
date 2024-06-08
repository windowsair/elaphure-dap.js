import {
  type AlgorithmJson,
  type DapDownloadOption,
  type DeviceMemInfo,
  type Sector,
  EraseType
} from './config'
import { dapLog, updateProgress } from './log'
import crc32Algo from './verify/crc.bin?uint8array'
import crc32 from 'crc-32'
import * as dapjs from '@elaphurelink/dapjs'

enum EraseFunc {
  ERASE = 1,
  PROGRAM = 2,
  VERIFY = 3
}

type MemorySector = {
  addr: number
  size: number
}

type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

function alignUp(x: number, a: number): number {
  return (x + a - 1) & (~(a - 1))
}

function alignDown(x: number, a: number): number {
  return (x) & (~(a - 1))
}

function toUint32Array(x: Uint8Array): Uint32Array {
  if (x.length % 4 == 0) {
    return new Uint32Array(x.buffer)
  } else {
    return new Uint32Array(x.buffer, 0, alignUp(x.length, 4))
  }
}

function typedArraysAreEqual(a: TypedArray, b: TypedArray) {
  if (a.byteLength !== b.byteLength) {
    return false
  }

  return a.every((val, i) => val === b[i])
}

async function loadAlgorithm(addr: number, bin: Uint8Array,
                             dap: dapjs.CortexM): Promise<void> {
  let algoBinLength
  let algoBinLoad: Uint8Array
  let algoBinLoadU32: Uint32Array
  const controlBin = new Uint8Array([0x2A, 0xBE, 0xE7, 0xFE]) // "BKPT" + "B ."

  algoBinLength = alignUp(bin.length, 4) + 4
  algoBinLoad = new Uint8Array(algoBinLength)
  algoBinLoad.set(controlBin, 0)
  algoBinLoad.set(bin, 4)
  algoBinLoadU32 = toUint32Array(algoBinLoad)

  await dap.writeBlock(addr, algoBinLoadU32)
}

/**
 * Flash algorithm resouce init
 *
 * @param dap DAP context
 * @param ramAddr Start address of device RAM
 * @param ramSize Total size of device RAM
 * @param algoSize Size of algorithm
 * @returns Promise of memory sector to store firmware data
 */
async function resourceInit(dap: dapjs.CortexM, ramAddr: number, ramSize: number,
                            algoSize: number): Promise<MemorySector> {
  /**
   * Resource layout
   *
   *  [ Flash Algorithm ] [ Firmware Data ] [ Padding ] [ Stack Data ] [ Padding ]
   *  |                                                                          |
   *  |---------------------------  RAM Size  ---------------------------------- |
   *  |                                                                          |
   * Start address of RAM                                         End address of RAM
   */

  // thumb for ARMv6-m, ARMv7-m, ARMv8-m
  const linkRegister = ramAddr + 1
  const stackPointer = alignDown(ramAddr + ramSize, 4)
  const programCounter = ramAddr

  // algoSize already algin to 4
  const startAddr = ramAddr + algoSize
  // 1KB stack
  const endAddr = stackPointer - 1024

  const sequence = [
    dap.writeCoreRegisterCommand(dapjs.CoreRegister.PC, programCounter),
    dap.writeCoreRegisterCommand(dapjs.CoreRegister.LR, linkRegister),
    dap.writeCoreRegisterCommand(dapjs.CoreRegister.SP, stackPointer)
  ]

  await dap.halt()
  await dap.transferSequence(sequence)

  // [Start, end)
  return {
    addr: startAddr,
    size: endAddr - startAddr
  }
}

async function execute(dap: dapjs.CortexM,
                       programCounter: number, ...registers: number[]): Promise<number> {
  const GENERAL_REGISTER_COUNT = 12
  const EXECUTE_TIMEOUT = 5000 // ms
  const EXECUTE_DELAY = 2

  // Create sequence of core register writes
  const sequence = [
    dap.writeCoreRegisterCommand(dapjs.CoreRegister.PC, programCounter)
  ]

  // Add in register values R0, R1, R2, etc.
  for (let i = 0; i < Math.min(registers.length, GENERAL_REGISTER_COUNT); i++) {
    sequence.push(dap.writeCoreRegisterCommand(i, registers[i]))
  }

  // Set EPSR.T to 1 => thumb mode
  sequence.push(dap.writeCoreRegisterCommand(dapjs.CoreRegister.PSR, 0x01000000))

  await dap.halt()
  await dap.transferSequence(sequence)
  await dap.resume(false) // Resume the target, without waiting
  // Wait for the target to halt on the breakpoint
  await dap.waitDelay(() => dap.isHalted(), EXECUTE_TIMEOUT, EXECUTE_DELAY)
  // Read return value of function
  return dap.readCoreRegister(dapjs.CoreRegister.R0)
}

async function eraseFullChip(dap: dapjs.CortexM, initAddr: number,
                             uninitAddr: number, eraseProgAddr: number): Promise<number> {
  // TODO: setting xtal clock
  const xtalClock = 12 * 1000 * 1000 // 12MHz
  let ret

  // Init erase
  ret = await execute(dap, initAddr, xtalClock, EraseFunc.ERASE)
  if (ret) {
    return ret
  }

  // Erase full chip
  ret = await execute(dap, eraseProgAddr)
  if (ret) {
    return ret
  }

  // Uninit erase
  ret = await execute(dap, uninitAddr, EraseFunc.ERASE)
  if (ret) {
    return ret
  }

  return 0
}

async function eraseChip(dap: dapjs.CortexM, offset: number, eraseSize: number, mem: DeviceMemInfo,
                         algo: AlgorithmJson, fullChip: boolean): Promise<number> {
  const initAddr = algo.initAddr + offset
  const uninitAddr = algo.unInitAddr + offset
  const progAddr = algo.eraseSectorAddr + offset
  const baseAddr = algo.devDesc.DevAdr
  const deviceTotalSize = Math.min(algo.devDesc.szDev, Number(mem.rom.size))
  // TODO: setting xtal clock
  const xtalClock = 12 * 1000 * 1000 // 12MHz
  let ret

  if (fullChip && algo.eraseChipAddr !== null) {
    const eraseChipAddr = algo.eraseChipAddr + offset
    return eraseFullChip(dap, initAddr, uninitAddr, eraseChipAddr)
  }

  // Init erase
  ret = await execute(dap, initAddr, baseAddr, xtalClock, EraseFunc.ERASE)
  if (ret) {
    return ret
  }

  const sectors: Sector[] = algo.devDesc.sectors

  let calcTotalSize = 0
  let leftSize = eraseSize
  let done = false
  for (let i = 0; i < sectors.length; i++) {
    if (done)
      break

    const perSectorSize = sectors[i].szSector
    const sectorStartAddr = sectors[i].AddrSector
    let sectorEndAddr
    // Calc sector end address
    if (i + 1 == sectors.length) {
      // This sector is the last sector
      sectorEndAddr = sectorStartAddr + (deviceTotalSize - calcTotalSize)
    } else {
      sectorEndAddr = sectors[i + 1].AddrSector - sectorStartAddr
    }

    // Start erase for these sectors
    for (let addr = sectorStartAddr; addr < sectorEndAddr; addr += perSectorSize) {
      ret = await execute(dap, progAddr, addr + baseAddr)
      if (ret) {
        return ret
      }

      leftSize -= perSectorSize
      if (leftSize <= 0) {
        updateProgress(100)
        done = true
        break
      } else {
        updateProgress((eraseSize - leftSize) / eraseSize * 100)
      }
    }

    calcTotalSize += sectorEndAddr - sectorStartAddr
  }

  // Uninit erase
  ret = await execute(dap, uninitAddr, EraseFunc.ERASE)

  return ret
}

export async function programSector(dap: dapjs.CortexM, progAddr: number,
                                    baseRamAddr: number, baseRomAddr: number,
                                    totalSize: number, pageSize: number,
                                    dataRom: MemorySector): Promise<number> {
  let leftSize = totalSize
  let programSize
  let ret

  while (leftSize > 0) {
    programSize = leftSize < pageSize ? leftSize : pageSize
    ret = await execute(dap, progAddr, baseRomAddr, programSize, baseRamAddr)
    if (ret) {
      return ret
    }

    baseRamAddr += programSize
    baseRomAddr += programSize
    leftSize -= programSize
    updateProgress((baseRomAddr - dataRom.addr) / dataRom.size * 100)
  }

  return 0
}

export async function programChip(dap: dapjs.CortexM, offset: number, dataRam: MemorySector,
                                  algo: AlgorithmJson, firmware: Uint8Array): Promise<number> {
  const initAddr = algo.initAddr + offset
  const uninitAddr = algo.unInitAddr + offset
  const progAddr = algo.programPageAddr + offset
  const baseAddr = algo.devDesc.DevAdr
  const xtalClock = 12 * 1000 * 1000 // 12MHz

  const pageSize = algo.devDesc.szPage
  const totalRamSize = dataRam.size
  const alignRamSize = totalRamSize - (totalRamSize % pageSize)

  let ret
  // Init program
  ret = await execute(dap, initAddr, baseAddr, xtalClock, EraseFunc.PROGRAM)
  if (ret) {
    return ret
  }

  const totalSize = firmware.length
  const dataRom: MemorySector = {
    addr: baseAddr,
    size: totalSize
  }
  let chunkOffset = 0
  let chunkSize = 0
  while (chunkOffset < totalSize) {
    // Get next chunk info
    const leftSize = totalSize - chunkOffset
    if (leftSize > totalRamSize) {
      /**
       * Not enough space left to save all the data,
       * only the aligned memory size is used.
       */
      chunkSize = alignRamSize
    } else {
      chunkSize = leftSize
    }

    // Load data to RAM
    const ramAddr = dataRam.addr
    const chunkData = firmware.slice(chunkOffset, chunkOffset + chunkSize)
    let chunkDataU32: Uint32Array
    let alignChunkSize
    if (chunkData.length % 4) {
      alignChunkSize = alignUp(chunkData.length, 4)
      const tmpChunkData = new Uint8Array(alignChunkSize)
      tmpChunkData.set(chunkData, 0)
      chunkDataU32 = toUint32Array(tmpChunkData)
    } else {
      alignChunkSize = chunkSize
      chunkDataU32 = toUint32Array(chunkData)
    }

    await dap.writeBlock(ramAddr, chunkDataU32)

    // Start to program this chunk in RAM
    const romAddr = baseAddr + chunkOffset
    ret = await programSector(dap, progAddr, ramAddr, romAddr, alignChunkSize, pageSize,
                              dataRom)
    if (ret) {
      return ret
    }

    // This chunk is processed.
    chunkOffset += chunkSize
  }

  // Uninit program
  ret = await execute(dap, uninitAddr, EraseFunc.PROGRAM)

  return ret
}

export async function verifyMemory(dap: dapjs.CortexM, romAddr: number,
                                   firmware: Uint8Array): Promise<number> {
  const wordCount = Math.floor(firmware.length / 4)
  const alignFirmware = firmware.slice(0, 4 * wordCount)

  const u32Firmware = toUint32Array(alignFirmware)
  const u32Res = await dap.readBlock(romAddr, wordCount)

  updateProgress(50)

  if (!typedArraysAreEqual(u32Firmware, u32Res)) {
    return -1
  }

  const bytes = firmware.length % 4
  for (let i = 0; i < bytes; i++) {
    const offset = 4 * wordCount + i
    const data = firmware[offset]

    const res = await dap.readMem8(romAddr + offset)
    if (res != data) {
      return -1
    }
  }

  return 0
}

export async function verifyFastCrc(dap: dapjs.CortexM, romAddr: number, dataRam: MemorySector,
                                    firmware: Uint8Array): Promise<number> {
  const length = firmware.length
  const addr = dataRam.addr
  let res, expect

  const crc32AlgoLen = alignUp(crc32Algo.length, 4)
  const alignAlgo = new Uint8Array(crc32AlgoLen)
  alignAlgo.set(crc32Algo, 0)
  const alignAlgoU32 = toUint32Array(alignAlgo)

  await dap.writeBlock(addr, alignAlgoU32)
  updateProgress(50)

  res = await execute(dap, addr, romAddr, length, 0)
  res = res >>> 0
  expect = crc32.buf(firmware)
  expect = expect >>> 0

  if (res != expect) {
    return -1
  }

  return 0
}

export async function verifyChip(dap: dapjs.CortexM, offset: number, dataRam: MemorySector,
                                 algo: AlgorithmJson, firmware: Uint8Array): Promise<number> {
  const initAddr = algo.initAddr + offset
  const uninitAddr = algo.unInitAddr + offset
  const romAddr = algo.devDesc.DevAdr
  const xtalClock = 12 * 1000 * 1000 // 12MHz
  let ret

  updateProgress(0)

  if (firmware.length < 512) {
    ret = verifyMemory(dap, romAddr, firmware)
  } else {
    ret = verifyFastCrc(dap, romAddr, dataRam, firmware)
  }

  updateProgress(100)

  return ret
}

export async function flash(algo: AlgorithmJson, algoBin: Uint8Array,
                            mem: DeviceMemInfo, firmware: Uint8Array,
                            option: DapDownloadOption, dap: dapjs.CortexM): Promise<number> {
  const ram = mem.ram
  const rom = mem.rom

  const prefixLen = 4
  const ramAddr = alignUp(Number(ram.start), 4)
  const ramSize = Number(ram.size) - (Number(ram.start) - ramAddr)
  const mainAlgoStartOffset = ramAddr + prefixLen
  const algoBinLength = alignUp(algoBin.length, 4) + prefixLen
  let ret = 0

  await loadAlgorithm(ramAddr, algoBin, dap)
  const dataRam: MemorySector = await resourceInit(dap, ramAddr, ramSize, algoBinLength)

  if (option.erase !== EraseType.None) {
    dapLog.startErase()
    ret = await eraseChip(dap, mainAlgoStartOffset, firmware.length, mem, algo,
                          option.erase === EraseType.Full)
    if (ret) {
      dapLog.failErase()
      return ret
    }
  }

  if (option.program) {
    dapLog.startProgram()
    ret = await programChip(dap, mainAlgoStartOffset, dataRam, algo, firmware)
    if (ret) {
      dapLog.failProgram()
      return ret
    }
  }

  if (option.verify) {
    dapLog.startVerify()
    ret = await verifyChip(dap, mainAlgoStartOffset, dataRam, algo, firmware)
    if (ret) {
      dapLog.failVerify()
      return ret
    }
  }

  await dap.halt()
  if (option.resetAfterDownload) {
    await dap.softReset()
  }

  return ret
}
