<template>
    <div class="VPContent is-home">
        <el-tabs type="border-card">
            <el-tab-pane label="Device" class="h-full">
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
                    <el-button type="primary" :disabled="isDAPConnected" @click="onDAPConnect">
                        {{ isDAPConnected ? "Connected" : isRemoteDAP ? "Connect" : "Select Device" }}
                    </el-button>
                </div>
            </el-tab-pane>
            <el-tab-pane label="Flash">
                <div class="m-4">
                    <p class="md-4 ela-text">Select Target Device</p>
                    <el-cascader class="mt-2" placeholder="Type to search:" :options="deviceIndexOption" filterable
                        v-model="targetDevice" />
                </div>
                <div class="m-4">
                    <p class="md-4 ela-text">Max Clock</p>
                    <el-cascader class="mt-2" :options="clockOptions" v-model="downloadOption.clock" />
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
            </el-tab-pane>
            <el-tab-pane label="Firmware">
                <el-container direction="vertical" class="h-full">
                    <div class="flex-none">
                        <FirmwareUpload />
                    </div>
                    <div class="mt-2 flex-auto h-full">
                        <el-input ref="logDiv" v-model="dapLogText" class="msg-output w-full h-full" type="textarea"
                            resize="none" :readonly="true" />
                    </div>
                    <div class="upload-start h-1/10">
                        <el-button class="mt-4" type="success" @click="startFlash">
                            Start to Flash
                        </el-button>
                    </div>
                </el-container>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<style>
.VPContent {
  flex-grow: 1;
  flex-shrink: 0;
  margin: var(--vp-layout-top-height, 0px) auto 0;
  width: 100%;
}

.VPContent.is-home {
  width: 100%;
  max-width: 100%;
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

.content .el-tabs__content {
  height: calc(98vh - 100px);
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

<script setup lang="ts">
import FirmwareUpload from './FirmwareUpload.vue'
import { ref, reactive, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import deviceIndexOption from '../device/deviceIndex.json'
import { firmwarePreprocess } from './dap/preprocess'
import { firmwareFile } from './dap/config'
import { dapLogText, log } from './dap/log'

const isRemoteDAP = useStorage('remote-dap', false)
const dapURI = useStorage('dap-uri', '')
const isDAPConnected = ref(false)
const targetDevice = useStorage('target-device', [])
const downloadOption = useStorage('download-option', {
    clock: 10000000,
    erase: 'none',
    program: true,
    verify: true,
})

let firmware
const isELFFormat = ref(false)


const startFlash = () => {
    firmwarePreprocess(firmwareFile.value)
}

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

log('Wait to flash...')
const logDiv = ref()
watch(dapLogText, () => {
    const textDiv = logDiv.value.textarea
    textDiv.scrollTop = textDiv.scrollHeight
})

</script>