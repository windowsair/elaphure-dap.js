import { computed } from 'vue'
import {
  currentLang,
  i18n,
  loadLocaleMessages,
  setI18nLanguage,
  SUPPORT_LOCALES
} from '../../i18n'
import { useData } from './data'

export function useLangs({
  removeCurrent = true,
  correspondingLink = false
} = {}) {
  const localeLinks = computed(() => SUPPORT_LOCALES)

  return { localeLinks, currentLang }
}

export function changeLanguage(targetLang: string) {
  let userLang = targetLang
  let userLangLabel
  let i
  for (i = 0; i < SUPPORT_LOCALES.length; i++) {
    if (SUPPORT_LOCALES[i].index === targetLang) {
      userLangLabel = SUPPORT_LOCALES[i].text
      break
    }
  }

  if (i == SUPPORT_LOCALES.length) {
    userLang = 'en-US'
    userLangLabel = 'English'
  }

  loadLocaleMessages(i18n, targetLang)
  setI18nLanguage(i18n, targetLang)
  currentLang.value = {
    index: userLang,
    label: userLangLabel
  }
}
