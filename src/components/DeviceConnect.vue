<template>
  <div class="DeviceConnect">
    <div class="mb-2 flex items-center text-sm">
      <el-radio-group v-model="isRemoteDAP" class="ml-4">
        <el-radio :value="true" size="large">{{ $t('devPage.remote') }}</el-radio>
        <el-radio :value="false" size="large">USB</el-radio>
      </el-radio-group>
    </div>
    <div class="mb-2 flex ml-4">
      <el-input v-if="isRemoteDAP" v-model="dapURI" style="width: 240px" placeholder="dap.local" />
    </div>
    <div class="mb-2 flex ml-4 mt-4">
      <el-button type="primary" :disabled="isDeviceConnect" @click="onDAPConnect">
        {{ isDeviceConnect ? $t('devPage.connected') :
                             isRemoteDAP ? $t('devPage.connect') : $t('devPage.select_device') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { isDeviceConnect, dapContext, downloadOption } from './dap/config'
import { log, logErr, logSuccess, logWarn } from './dap/log'
import * as dapjs from '@elaphurelink/dapjs'
import { isHttps, isLocalNetwork, redirectToHttp, redirectToHttps } from './composables/site'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const isRemoteDAP = useStorage('remote-dap', false)
const dapURI = useStorage('dap-uri', 'dap.local')

const onDAPConnect = async () => {
  isDeviceConnect.value = false
  dapContext.value = undefined

  let transport: dapjs.WebUSB | dapjs.WebSocketTransport | null = null

  try {
    if (!isRemoteDAP.value) {
      // Webusb is only availablein https security contexts
      if (!isLocalNetwork()) {
        if (!isHttps()) {
          logWarn(t('devPage.redirect_to_https_info'))
          redirectToHttps()
          return
        }
      }

      if (!navigator.usb) {
        logErr(t('devPage.webusb_not_support'))
        return
      }

      const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0xD28 }]
      })

      transport = new dapjs.WebUSB(device)
    } else {
      // Remote feature does not support https
      if (!isLocalNetwork()) {
        if (isHttps()) {
          logWarn(t('devPage.redirect_to_http_info'))
          redirectToHttp()
          return
        }
      }

      const addr = `ws://${dapURI.value}:3240/`
      transport = new dapjs.WebSocketTransport(addr)
    }
  } catch (err) {
    log(String(err))
  }

  if (!transport) {
    return
  }

  const clock = downloadOption.value.clock
  const processor: dapjs.CortexM = new dapjs.CortexM(transport, 0, clock)
  await processor.connect()
  await processor.halt(true, 1000)

  const ret = await processor.isHalted()
  if (!ret) {
    log(t('devPage.halt_timeout_info'))
    return
  }

  logSuccess(t('devPage.success_connect_info'))
  dapContext.value = processor
  isDeviceConnect.value = true
}

</script>