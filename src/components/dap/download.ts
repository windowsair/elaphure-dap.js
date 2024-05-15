import {
  type AlgorithmJson,
  type DeviceRam
} from './config'
import * as dapjs from '@elaphurelink/dapjs'

function align(x: number, a: number): number {
  return (x + a - 1) & (~(a - 1))
}

function toUint32Array(x: Uint8Array): Uint32Array {
  if (x.length % 4 == 0) {
    return new Uint32Array(x.buffer)
  } else {
    return new Uint32Array(x.buffer, 0, align(x.length, 4))
  }
}

async function loadAlgorithm(addr: number, bin: Uint8Array, dap: dapjs.CortexM): Promise<void> {
  let algoBinLength
  let algoBinLoad:Uint8Array
  let algoBinLoadU32:Uint32Array
  const controlBin = new Uint8Array([0x2A, 0xBE, 0xE7, 0xFE]) // "BKPT" + "B ."

  algoBinLength = align(bin.length, 4) + 4
  algoBinLoad = new Uint8Array(algoBinLength)
  algoBinLoad.set(controlBin, 0)
  algoBinLoad.set(bin, 4)
  algoBinLoadU32 = toUint32Array(algoBinLoad)

  await dap.writeBlock(addr, algoBinLoadU32)
}

export async function flash(algo: AlgorithmJson, algoBin: Uint8Array,
  ram:DeviceRam, firmware: Uint8Array, dap: dapjs.CortexM) {
  const ramAddr = Number(ram.start)
  const ramSize = Number(ram.size)
  const algoBinLength = align(algoBin.length, 4) + 4

  await loadAlgorithm(ramAddr, algoBin, dap)
}