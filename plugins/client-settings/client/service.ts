import type { SettingsPageConfig } from './schema'
import { ref } from 'vue'
import { SettingsPageConfigSchema } from './schema'

export const original = ref<SettingsPageConfig>(new SettingsPageConfigSchema())
export const resolved = ref<SettingsPageConfig>(new SettingsPageConfigSchema())

export function useConfig(useOriginal = false) {
  return useOriginal ? original : resolved
}
