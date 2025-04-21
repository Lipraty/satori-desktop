import { builtinModules } from 'node:module'
import type { UserConfig } from 'vite'

export const OUT_DIR = 'lib'
export const ENTRY = 'src/index.ts'

export const externals = (external: string[] = []) => {
  return [
    'electron',
    'electron/main',
    'electron/renderer',
    'electron/common',
    'electron/remote',
    ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
    ...external,
  ]
}

export interface BundleConfig {
  priprocess?: (root: string, external: string[]) => UserConfig
  config?: UserConfig
}
