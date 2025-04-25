import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
      rollupOptions: {
        input: './index.html',
        output: {
          format: 'iife',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        },
        external: [
          'electron',
          'electron-devtools-installer',
          'electron-reload',
          'electron-store',
          'vue',
          'vuetify',
          'vue-router',
          'cordis',
          '@cordisjs/logger',
          'reggol'
        ]
      }
    },
    plugins: [pluginExposeRenderer(name), vue()],
    resolve: {
      preserveSymlinks: true,
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
