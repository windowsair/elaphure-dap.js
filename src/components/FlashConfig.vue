<template>
  <div class="FlashConfig">
    <div class="m-4">
      <p class="md-4 ela-text">Select Target Device</p>
      <el-cascader class="mt-2" ref="cascaderRef" placeholder="Type to search:" :options="deviceIndexOption"
        @change="onDeviceChange" :show-all-levels="false" filterable v-model="targetDevice" />
    </div>
    <div class="m-4">
      <p class="md-4 ela-text">Max Clock</p>
      <el-cascader class="mt-2" :options="clockOptions" v-model="clock" />
    </div>
    <div class="mb-2 flex items-center text-sm">
      <el-radio-group v-model="downloadOption.erase" class="ml-4">
        <el-radio value="full" size="large">Erase Full Chip</el-radio>
        <el-radio value="part" size="large">Erase Sectors</el-radio>
        <el-radio value="none" size="large">Do Not Erase</el-radio>
      </el-radio-group>
    </div>

    <div class="mb-2 flex items-center text-sm ml-4">
      <el-checkbox v-model="downloadOption.program" label="Program" size="large" />
      <el-checkbox v-model="downloadOption.verify" label="Verify" size="large" />
    </div>

  </div>
</template>

<script setup lang="ts">
import { RefSymbol } from '@vue/reactivity';
import deviceIndexOption from '../device/deviceIndex.json'
import { type DeviceListInfo, algorithmBin, algorithmInfo, downloadOption, memInfo } from './dap/config'
import { useStorage } from '@vueuse/core'
import { ref, watch, onMounted } from 'vue'

const targetDevice = useStorage('target-device', [])
const clock = ref<number[]>([downloadOption.value.clock])

watch(clock, (val: number[]) => {
  downloadOption.value.clock = val[0]
})

const getFile = async (addr: string, isBin: boolean) => {
  try {
    const response = await fetch(addr, { cache: 'default' })
    if (!response.ok) {
      return null
    }

    if (isBin) {
      const buffer = await response.arrayBuffer()
      return new Uint8Array(buffer)
    } else {
      return await response.json()
    }
  } catch (error) {
    return null
  }
}

const cascaderRef = ref()

const updateAlgo = async () => {
  const nodes = cascaderRef.value.getCheckedNodes()
  if (!nodes.length)
    return

  const data: DeviceListInfo = nodes[0].data

  let algoName: string | null = null
  for (const item of data.algorithm) {
    if (Number(item.default) == 1) {
      algoName = item.name
    }
  }

  if (!algoName) {
    algoName = data.algorithm[0].name
  }

  // "Flash/STM32F10x_OPT.FLM" => "STM32F10x_OPT.FLM"
  algoName = algoName.split("/").pop() as string
  if (!algoName?.length) {
    return
  }

  const prefix = ''
  const [vendorName, seriesName] = targetDevice.value
  const base = `${prefix}/${vendorName}/${seriesName}/`

  const algoJsonName = algoName.slice(0, -4) + '.json'
  const algoBinName = algoName.slice(0, -4) + '.bin'
  const algoJsonPath = base + algoJsonName
  const algoBinPath = base + algoBinName

  algorithmInfo.value = await getFile(algoJsonPath, false)
  algorithmBin.value = await getFile(algoBinPath, true)

  memInfo.value = {
    ram: data.ram,
    rom: data.rom
  }
}

const onDeviceChange = async () => {
  await updateAlgo()
}

onMounted(async () => {
  await updateAlgo()
})

const clockOptions = [
  {
    value: 10000000,
    label: '10MHz'
  },
  {
    value: 5000000,
    label: '5MHz'
  },
  {
    value: 1000000,
    label: '1MHz'
  },
  {
    value: 500000,
    label: '500kHz'
  },
  {
    value: 200000,
    label: '200kHz'
  },
  {
    value: 100000,
    label: '100kHz'
  },
  {
    value: 50000,
    label: '50kHz'
  },
  {
    value: 20000,
    label: '20kHz'
  },
  {
    value: 10000,
    label: '10kHz'
  },
  {
    value: 5000,
    label: '5kHz'
  },
]

</script>