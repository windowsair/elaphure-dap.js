<template>
  <div class="VPContent is-home">
    <el-tabs type="border-card">
      <el-tab-pane
        :label="$t('devPage.device')"
        class="h-full"
        :disabled="isStart"
      >
        <DeviceConnect />
      </el-tab-pane>
      <el-tab-pane
        :label="$t('flashPage.flash')"
        :disabled="isStart"
      >
        <FlashConfig />
      </el-tab-pane>
      <el-tab-pane :label="$t('firmPage.firmware')">
        <el-container
          direction="vertical"
          class="h-full"
        >
          <div class="flex-none">
            <FirmwareUpload />
          </div>
          <div class="mt-2 flex-auto h-full">
            <el-input
              ref="logDiv"
              v-model="dapLogText"
              class="msg-output w-full h-full"
              type="textarea"
              resize="none"
              :readonly="true"
            />
          </div>
          <div class="upload-start h-1/10">
            <el-button
              class="mt-4"
              type="primary"
              :disabled="isStart"
              @click="startFlash"
            >
            {{ $t('firmPage.start_info') }}
            </el-button>
          </div>
        </el-container>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRaw } from 'vue'
import FirmwareUpload from './FirmwareUpload.vue'
import FlashConfig from './FlashConfig.vue'
import DeviceConnect from './DeviceConnect.vue'
import { firmwarePreprocess } from './dap/preprocess'
import {
  firmwareFile,
  algorithmBin,
  algorithmInfo,
  dapContext,
  memInfo,
  isStart,
  downloadOption
} from './dap/config'
import { flash } from './dap/download'
import { dapLogText, log, logErr, logSuccess, updateProgress } from './dap/log'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const startFlash = async () => {
  const algoBin = toRaw(algorithmBin).value
  const algoInfo = toRaw(algorithmInfo).value
  const mem = toRaw(memInfo).value
  if (!algoBin || !algoInfo || !mem) {
    log(t('dap.device_invalid_info'))
    return
  }

  const firmware = await firmwarePreprocess(firmwareFile.value)
  if (!firmware) {
    log(t('dap.firmware_invalid_info'))
    return
  }

  const dap = toRaw(dapContext).value
  if (!dap) {
    log(t('dap.dap_invalid_info'))
    return
  }

  updateProgress(0)
  isStart.value = true

  let ret = 0

  try {
    const option = toRaw(downloadOption).value
    ret = await flash(algoInfo, algoBin, mem, firmware, option, dap)
  } catch (error) {
    const err = error as Error
    const msg = err.message
    logErr(msg)
    log(t('dap.download_fail_info'))
  }

  if (ret) {
    logErr(t('dap.download_fail_info'))
  } else {
    logSuccess(t('dap.download_success_info'))
  }

  isStart.value = false
}

log(t('dap.wait_info'))
const logDiv = ref()
watch(dapLogText, () => {
  const textDiv = logDiv.value.textarea
  textDiv.scrollTop = textDiv.scrollHeight
})

</script>

<style>
.VPContent .el-tabs {
  display: flex;
  flex-direction: column;
}

.VPContent .el-tabs__content {
  flex-grow: 1;
}

.VPContent {
  flex-grow: 1;
  flex-shrink: 0;
  margin: var(--vp-layout-top-height, 0px) auto 0;
  width: 100%;
}

.VPContent.is-home {
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  display: flex;
}

.VPContent.has-sidebar {
  margin: 0;
}

@media (min-width: 960px) {
  .VPContent {
    padding-top: var(--vp-nav-height);
  }

  .VPContent.has-sidebar {
    margin: var(--vp-layout-top-height, 0px) 0 0;
    padding-left: var(--vp-sidebar-width);
  }
}

@media (min-width: 1440px) {
  .VPContent.has-sidebar {
    padding-right: calc((100vw - var(--vp-layout-max-width)) / 2);
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
  }
}

.content .el-tabs__header {
  min-height: 40px;
}

.content .el-tab-pane {
  height: 100%;
}

.content .el-tabs--border-card {
  border: none;
  flex-grow: 1;
}

.msg-output>textarea {
  height: 100%;
}
</style>
