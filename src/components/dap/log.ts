import { ref } from 'vue'

export const dapLogText = ref<string>('')
export const dapProgress = ref<number>(0)

export type logFunc = (text: string) => void

export function log(text: string) {
  dapLogText.value += `${text}\n`
}

export function clearLog() {
  dapLogText.value = ''
}

export function updateProgress(num: number) {
  dapProgress.value = num | 0 // Convert to int
}
