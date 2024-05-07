import {
        computed,
        inject,
        readonly,
        ref,
        shallowRef,
        watch,
        type InjectionKey,
        type Ref
} from 'vue'
import type { DefaultTheme } from './theme'

export const dataSymbol: InjectionKey<VitePressData> = Symbol()

export interface VitePressData<T = any> {
        theme: Ref<T>
        lang: Ref<string>
        isDark: Ref<boolean>
}

function useData$<T = any>(): VitePressData<T> {
        const data = inject(dataSymbol)
        if (!data) {
                throw new Error('vitepress data not properly injected in app')
        }
        return data
}

export const useData: typeof useData$<DefaultTheme.Config> = useData$
