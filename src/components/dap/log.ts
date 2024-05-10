import { ref } from 'vue'

export const dapLogText = ref<string>('')

export type logFunc = (text: string) => void

export function log(text: string) {
    dapLogText.value += `${text}\n`
}

export function clearLog() {
    dapLogText.value = ''
}
