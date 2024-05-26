<template>
  <div class="FirmwareUpload">
    <el-upload class="FirmwareUpload" drag :on-change="updateFile" :auto-upload="false" :show-file-list="false">
      <div class="upload-input">
        <div class="icon-transition">
          <Transition :duration="400" mode="out-in" leave-active-class="animate__animated animate__flipOutX"
            enter-active-class="animate__animated animate__flipInX">
            <div v-if="!isStart" key=1>
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            </div>
            <div v-else key=2>
              <el-progress :percentage="dapProgress" type="circle" :width="100" />
            </div>
          </Transition>
        </div>
        <div class="el-upload__text">
          <div v-if="!uploadFileList">
            {{ $t('firmPage.drop_info') }} <em>{{ $t('firmPage.click_info') }}</em>
          </div>
          <div v-else>
            {{ fileInfoShow }}
          </div>
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile, UploadFiles } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
import { firmwareFile, isStart } from './dap/config'
import { dapProgress } from './dap/log'

const uploadFileList = ref<UploadFile>()
const fileInfoShow = computed(()=> {
  const name = uploadFileList.value?.name
  if (name === undefined) {
    return ''
  }

  const size = uploadFileList.value?.size
  let sizeStr = ''

  if (size !== undefined) {
    if (size < 1024) {
      sizeStr = `${size}byte`
    } else {
      sizeStr = `${Math.floor(size / 1024)} KB`
    }
  }

  return name + ' | ' + sizeStr
})


const updateFile = (file: UploadFile, fileList: UploadFiles) => {
  uploadFileList.value = file
  firmwareFile.value = file.raw
}

</script>

<style>
.FirmwareUpload .el-upload-dragger {
  padding: 30px var(--el-upload-dragger-padding-vertical);
}

.icon-transition {
  display: flex;
  height: 80px;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

/* .fade-enter-active,
.fade-leave-active {
  transition: transform 0.5s, opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-to,
.fade-leave {
  transform: translateX(0);
  opacity: 1;
} */
</style>
