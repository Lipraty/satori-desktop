import type { Plugin } from 'vite'
import path from 'path'

export function injectCssImports(): Plugin {
  return {
    name: 'vite-plugin-inject-css-imports',
    enforce: 'post',
    apply: 'build',

    async generateBundle(_, bundle) {
      const cssAssets = new Map<string, string>()
      for (const fileName in bundle) {
        if (fileName.endsWith('.css')) {
          const baseName = path.basename(fileName, '.css')
          cssAssets.set(baseName, fileName)
        }
      }
      for (const fileName in bundle) {
        if (fileName.endsWith('.vue.js') || fileName.endsWith('.vue.mjs')) {
          const chunk = bundle[fileName]
          if (chunk.type !== 'chunk') continue
          const baseName = path.basename(fileName, fileName.endsWith('.vue.js') ? '.vue.js' : '.vue.mjs')
          const cssFileName = cssAssets.get(baseName)
          if (cssFileName) {
            const isEsm = fileName.endsWith('.mjs')
            const relativePath = path.relative(path.dirname(fileName), cssFileName)
            const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`
            chunk.code = isEsm ? `import '${importPath}'\n${chunk.code}` : `require('${importPath}')\n${chunk.code}`
          }
        }
      }
    }
  }
}
