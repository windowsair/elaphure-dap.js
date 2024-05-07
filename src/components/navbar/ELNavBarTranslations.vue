<script lang="ts" setup>
import { useData } from '../composables/data'
import { useLangs, changeLanguage } from '../composables/langs'
import translateIcon from "@assets/translate.svg?component"

const { theme } = useData()
const { localeLinks, currentLang } = useLangs({ correspondingLink: true })
</script>

<template>
    <div class="ELNavBarTranslations">
        <el-dropdown @command="changeLanguage">
            <div class="outline-unset">
                <translateIcon class="fill-current" color="var(--el-text-color-regular)" />
            </div>
            <template #dropdown>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item v-for="item in localeLinks" :command="item.index"> {{ item.text }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<style scoped>
.ELNavBarTranslations {
    display: none;
}

@media (min-width: 1280px) {
    .ELNavBarTranslations {
        display: flex;
        align-items: center;
    }
}
</style>
