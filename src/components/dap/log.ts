import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { i18n } from '../../i18n'

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

export class dapLog {
  private static t(text: string) {
    return i18n.global.t(text)
  }

  public static startErase() {
    log(this.t('dap.start_erase_info'))
  }

  public static failErase() {
    log(this.t('dap.fail_erase_info'))
  }

  public static startProgram() {
    log(this.t('dap.start_program_info'))
  }

  public static failProgram() {
    log(this.t('dap.fail_program_info'))
  }

  public static startVerify() {
    log(this.t('dap.start_verify_info'))
  }

  public static failVerify() {
    log(this.t('dap.fail_verify_info'))
  }
}
