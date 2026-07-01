import type { Plugin } from 'vite'

import path from 'node:path'

export function injectCssImports(): Plugin {
  return {
    name: 'vite-plugin-inject-css-imports',
    enforce: 'post',
    apply: 'build',

    async generateBundle(_, bundle) {
      const cssFiles = Object.keys(bundle).filter(name => name.endsWith('.css'))
      for (const fileName in bundle) {
        if (fileName.endsWith('.vue.js') || fileName.endsWith('.vue.mjs')) {
          const chunk = bundle[fileName]
          if (chunk.type !== 'chunk')
            continue
          const baseName = path.basename(fileName, fileName.endsWith('.vue.js') ? '.vue.js' : '.vue.mjs')
          const dirName = path.dirname(fileName)
          const cssFileName = cssFiles.find((css) => {
            return path.basename(css, '.css') === baseName && path.dirname(css) === dirName
          })

          if (cssFileName) {
            const isEsm = fileName.endsWith('.mjs')
            const importPath = `./${path.basename(cssFileName)}`
            chunk.code = isEsm
              ? `import '${importPath}'\n${chunk.code}`
              : `require('${importPath}')\n${chunk.code}`
          }
        }
      }
    },
  }
}
