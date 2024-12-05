import { fileURLToPath } from 'node:url';

import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'

import { pluginExposeRenderer } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'renderer'>;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name), react()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@renderer': fileURLToPath(new URL("./src/renderer", import.meta.url)),
        '@shared': fileURLToPath(new URL("./src/shared", import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    clearScreen: false,
  } as UserConfig;
});
