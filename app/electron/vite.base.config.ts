import { builtinModules } from 'node:module';
import type { AddressInfo } from 'node:net';

import type { ConfigEnv, Plugin, UserConfig } from 'vite';

import pkg from './package.json';
import path from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

export const external = [...builtins, ...Object.keys('dependencies' in pkg ? (pkg.dependencies as Record<string, unknown>) : {})];

export function getBuildConfig(env: ConfigEnv<'build'>): UserConfig {
  const { root, mode, command } = env;

  return {
    root,
    mode,
    build: {
      // Prevent multiple builds from interfering with each other.
      emptyOutDir: false,
      // 🚧 Multiple builds may conflict.
      outDir: '.vite/build',
      watch: command === 'serve' ? {} : null,
      minify: command === 'build',
    },
    clearScreen: false,
  };
}

export function getDefineKeys(names: string[]) {
  const define: { [name: string]: VitePluginRuntimeKeys } = {};

  return names.reduce((acc, name) => {
    const NAME = name.toUpperCase();
    const keys: VitePluginRuntimeKeys = {
      VITE_DEV_SERVER_URL: `${NAME}_VITE_DEV_SERVER_URL`,
      VITE_NAME: `${NAME}_VITE_NAME`,
    };

    return { ...acc, [name]: keys };
  }, define);
}

export function getBuildDefine(env: ConfigEnv<'build'>) {
  const { command, forgeConfig } = env;
  const names = forgeConfig.renderer.filter(({ name }) => name != null).map(({ name }) => name!);
  const defineKeys = getDefineKeys(names);
  const define = Object.entries(defineKeys).reduce((acc, [name, keys]) => {
    const { VITE_DEV_SERVER_URL, VITE_NAME } = keys;
    const def = {
      [VITE_DEV_SERVER_URL]: command === 'serve' ? JSON.stringify(process.env[VITE_DEV_SERVER_URL]) : undefined,
      [VITE_NAME]: JSON.stringify(name),
    };
    return { ...acc, ...def };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>);

  return define;
}

export function pluginExposeRenderer(name: string): Plugin {
  const { VITE_DEV_SERVER_URL } = getDefineKeys([name])[name];

  return {
    name: '@electron-forge/plugin-vite:expose-renderer',
    configureServer(server) {
      process.viteDevServers ??= {};
      // Expose server for preload scripts hot reload.
      process.viteDevServers[name] = server;

      server.httpServer?.once('listening', () => {
        const addressInfo = server.httpServer!.address() as AddressInfo;
        // Expose env constant for main process use.
        process.env[VITE_DEV_SERVER_URL] = `http://localhost:${addressInfo?.port}`;
      });
    },
  };
}

export function pluginHotRestart(command: 'reload' | 'restart'): Plugin {
  return {
    name: '@electron-forge/plugin-vite:hot-restart',
    closeBundle() {
      if (command === 'reload') {
        for (const server of Object.values(process.viteDevServers)) {
          // Preload scripts hot reload.
          server.ws.send({ type: 'full-reload' });
        }
      } else {
        // Main process hot restart.
        // https://github.com/electron/forge/blob/v7.2.0/packages/api/core/src/api/start.ts#L216-L223
        process.stdin.emit('data', 'rs');
      }
    },
  };
}

export function pluginProdPluginGenerator(): Plugin {
  return {
    name: 'vite-plugin-prod-plugin-generator',
    async writeBundle() {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const Schema = require('cordis').Schema;

      const internalPlugins = await loadAndProcessPlugins('src/internal', true);
      const externalPlugins = await loadAndProcessPlugins('src/plugins', false);
      const pluginsArray = [...internalPlugins, ...externalPlugins];

      this.emitFile({
        type: 'asset',
        fileName: 'plugins.js',
        source: `export default ${JSON.stringify(pluginsArray, null, 2)};`
      });

      async function loadAndProcessPlugins(dirPath: string, isInternal: boolean) {
        const pluginsPath = path.resolve(__dirname, dirPath);
        if (!existsSync(pluginsPath)) return [];

        const plugins = [];
        const files = getPluginFiles(pluginsPath);

        for (const file of files) {
          try {
            const module = require(file);
            const exports = [];
            if (typeof module?.default === 'function') exports.push(module.default);
            else if (typeof module?.apply === 'function') {
              exports.push(module);
            } else if (typeof module === 'object') {
              for (const key in module) {
                const exported = module[key];
                if (typeof exported?.default === 'function') exports.push(exported.default);
                if (typeof exported?.apply === 'function') exports.push(exported);
              }
            }
            for (const plugin of exports) {
              const name = (plugin.name || plugin.constructor.name).replace(/Service$/, '').toLowerCase();
              const validate = plugin.Config && plugin.Config instanceof Schema ? plugin.Config : undefined;
              const schema = validate ? reverseSchema(validate) : undefined;
              plugins.push({
                name,
                schema,
                internal: isInternal,
                plugin: null
              });
            }
          } catch (error) {
            console.error(`处理插件失败: ${file}`, error);
          }
        }
        return plugins;
      }
      function getPluginFiles(dir: string): string[] {
        // @ts-ignore
        const result = [];
        // @ts-ignore
        if (!existsSync(dir)) return result;
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (statSync(fullPath).isDirectory()) {
            const indexFile = path.join(fullPath, 'index.ts');
            if (existsSync(indexFile)) {
              result.push(indexFile);
            }
          } else if (path.extname(fullPath) === '.ts') {
            result.push(fullPath);
          }
        }
        return result;
      }
      function reverseSchema(schema: typeof Schema) {
        const { type, meta } = schema;
        const result = { type, meta, children: {} };
        if (type === 'const') result.children = schema.value;
        if (type === 'transform') result.children = reverseSchema(schema.inner);
        if (type === 'object') {
          Object.keys(schema.dict).forEach(key => {
            // @ts-ignore
            result.children[key] = reverseSchema(schema.dict[key]);
          });
        } else if (['tuple', 'intersect', 'union'].includes(type)) {
          // @ts-ignore
          result.children = schema.list.map(s => reverseSchema(s));
        } else if (type === 'dict') {
          result.children = reverseSchema(schema.inner);
        } else if (type === 'array') {
          result.children = reverseSchema(schema.inner);
        } else if (['string', 'number', 'boolean'].includes(type)) {
          // @ts-ignore
          result.children = null;
        }
        return result;
      }
    }
  };
}
