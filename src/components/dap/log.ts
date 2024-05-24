import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export const dapLogText = ref<string>('')
export const dapProgress = ref<number>(0)

export type logFunc = (text: string) => void

export function log(text: string) {
  dapLogText.value += `${text}\n`
}

export function logSuccess(text: string) {
  log(text)
  ElMessage({
    message: text,
    type: 'success',
    duration: 1500
  })
}

export function logWarn(text: string) {
  log(text)
  ElMessage({
    message: text,
    type: 'warning',
    duration: 1500
  })
}

export function logErr(text: string) {
  log(text)
  ElMessage({
    message: text,
    type: 'error',
    duration: 1500
  })
}

export function clearLog() {
  dapLogText.value = ''
}

export function updateProgress(num: number) {
  dapProgress.value = num | 0 // Convert to int
}
