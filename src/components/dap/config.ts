import { ref, shallowRef } from 'vue'
import { useStorage } from '@vueuse/core'
import * as dapjs from '@elaphurelink/dapjs'

export const downloadOption = useStorage('download-option', {
  clock: 10000000,
  erase: 'none',
  program: true,
  verify: true
})
export const firmwareFile = ref<File>()
export const algorithmBin = ref<Uint8Array>()
export const algorithmInfo = ref<AlgorithmJson>()
export const memInfo = ref<DeviceMemInfo>()

export const isDeviceConnect = ref<boolean>(false)
export const dapContext = shallowRef<dapjs.CortexM>()

export type Sector = {
  szSector: number
  AddrSector: number
}

export type DeviceDescription = {
  Vers: number
  DevName: string
  DevType: number
  DevAdr: number
  szDev: number
  szPage: number
  Res: number
  valEmpty: number
  toProg: number
  toErase: number
  sectors: Sector[]
}

export type AlgorithmJson = {
  initAddr: number
  unInitAddr: number
  eraseChipAddr: number | null // optional
  eraseSectorAddr: number
  programPageAddr: number
  descAddr: number
  descSize: number
  devDesc: DeviceDescription
}

export type DeviceAlgorithm = {
  default: string
  name: string
  start: string
  size: string
}

export type DeviceMem = {
  start: string
  size: string
}

export type DeviceListInfo = {
  value: string
  label: string
  algorithm: DeviceAlgorithm[]
  ram: DeviceMem
  rom: DeviceMem
}

export type DeviceMemInfo = {
  ram: DeviceMem
  rom: DeviceMem
}
