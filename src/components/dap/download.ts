import {
  type AlgorithmJson,
  type DeviceMemInfo
} from './config'
import * as dapjs from '@elaphurelink/dapjs'

type MemorySector = {
  addr: number
  size: number
}

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
  const EXECUTE_TIMEOUT = 2000 // ms

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
  await dap.waitDelay(() => dap.isHalted(), EXECUTE_TIMEOUT)
  // Read return value of function
  return dap.readCoreRegister(dapjs.CoreRegister.R0)
}

export async function flash(algo: AlgorithmJson, algoBin: Uint8Array,
                            mem: DeviceMemInfo, firmware: Uint8Array,
                            dap: dapjs.CortexM): Promise<number> {
  const ram = mem.ram
  const rom = mem.rom

  const ramAddr = alignUp(Number(ram.start), 4)
  const ramSize = Number(ram.size) - (Number(ram.start) - ramAddr)
  const algoBinLength = alignUp(algoBin.length, 4) + 4

  await loadAlgorithm(ramAddr, algoBin, dap)
  const dataRam: MemorySector = await resourceInit(dap, ramAddr, ramSize, algoBinLength)
}
