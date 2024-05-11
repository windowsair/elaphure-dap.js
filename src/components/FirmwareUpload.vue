<template>
  <div class="FirmwareUpload">
    <el-upload class="FirmwareUpload" drag :on-change="updateFile" :auto-upload="false" :show-file-list="false">
      <div class="upload-input">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          <div v-if="!uploadFileList">
            Drop file here or <em>click to upload</em>
          </div>
          <div v-else>
            {{ uploadFileList.name }}
          </div>
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile, UploadFiles } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { firmwareFile } from './dap/config'

const uploadFileList = ref<UploadFile>()

const updateFile = (file: UploadFile, fileList: UploadFiles) => {
  uploadFileList.value = file
  firmwareFile.value = file.raw
}

</script>
