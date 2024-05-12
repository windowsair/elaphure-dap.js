<template>
  <div class="DeviceConnect">
    <div class="mb-2 flex items-center text-sm">
      <el-radio-group v-model="isRemoteDAP" class="ml-4">
        <el-radio :value="true" size="large">Remote</el-radio>
        <el-radio :value="false" size="large">USB</el-radio>
      </el-radio-group>
    </div>
    <div class="mb-2 flex ml-4">
      <el-input v-if="isRemoteDAP" v-model="dapURI" style="width: 240px" placeholder="dap.local" />
    </div>
    <div class="mb-2 flex ml-4 mt-4">
      <el-button type="primary" :disabled="isDeviceConnect" @click="onDAPConnect">
        {{ isDeviceConnect ? "Connected" : isRemoteDAP ? "Connect" : "Select Device" }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { isDeviceConnect, dapContext, downloadOption } from './dap/config'
import { log } from './dap/log'
import * as dapjs from '@elaphurelink/dapjs'

const isRemoteDAP = useStorage('remote-dap', false)
const dapURI = useStorage('dap-uri', '')

const onDAPConnect = async () => {
  isDeviceConnect.value = false
  dapContext.value = undefined

  let device: USBDevice | undefined

  try {
    if (!isRemoteDAP.value) {
      device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
      })
    } else {
      // TODO: remote device
    }
  } catch (err) {
    log(String(err))
  }

  if (!device) {
    return
  }

  const clock = downloadOption.value.clock
  const transport = new dapjs.WebUSB(device)
  const processor: dapjs.CortexM = new dapjs.CortexM(transport, 0, clock)
  await processor.connect()
  await processor.halt(true, 1000)

  const ret = await processor.isHalted()
  if (!ret) {
    log('Halt device timeout.')
    return
  }

  log('Successfully connected to the device.')
  dapContext.value = processor
  isDeviceConnect.value = true
}

</script>