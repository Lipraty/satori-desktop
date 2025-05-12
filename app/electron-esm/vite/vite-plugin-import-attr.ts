import { Plugin } from 'vite'
import MagicString from 'magic-string'
import { extname } from 'path'
import { OutputBundle, OutputChunk } from 'rollup'

interface ImportAttributesPluginOptions {
  /** 强制启用，忽略 Node 版本检查 */
  force?: boolean
  /** 最低 Node 主版本要求 */
  minNodeVersion?: number
  /** 需要处理的资源扩展名 */
  extensions?: string[]
  /** 调试日志 */
  debug?: boolean
}

export default function importAttributesPlugin(
  options: ImportAttributesPluginOptions = {}
): Plugin {
  const {
    force = false,
    minNodeVersion = 22,
    extensions = ['.json'],
    debug = false
  } = options

  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
  const enabled = force || nodeMajor >= minNodeVersion
  const log = (msg: string, ...args: any[]) => debug && console.log(`[vite-plugin-import-attrs] ${msg}`, ...args)

  return {
    name: 'vite-plugin-import-attributes',
    enforce: 'post',
    apply: 'build',

    generateBundle(_options, bundle: OutputBundle) {
      if (!enabled) return
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName] as OutputChunk
        if (chunk.type !== 'chunk' || chunk.isEntry === false || chunk.facadeModuleId == null) continue
        if (chunk.fileName.endsWith('.js') && chunk.fileName.endsWith('.mjs') || chunk.fileName.endsWith('.cjs')) {
          // skip non-esm or cjs
        }
        // only process esm
        if (chunk.fileName.endsWith('.mjs') || chunk.fileName.endsWith('.js')) {
          log(`Processing chunk: ${fileName}`)
          const code = chunk.code
          const magic = new MagicString(code)
          const ast = this.parse(code) as any
          let modified = false

          for (const node of ast.body) {
            if (node.type === 'ImportDeclaration') {
              const src = node.source.value as string
              const ext = extname(src)
              if (!extensions.includes(ext)) continue
              if (node.attributes && node.attributes.length > 0) continue

              const { start, end } = node.source
              const type = ext.slice(1)
              // insert before end quote
              magic.appendRight(end, ` with { type: '${type}' }`)
              modified = true
              log(`Injected attributes for ${src}`)
            }
          }
          if (modified) {
            chunk.code = magic.toString()
            if (chunk.map) {
              chunk.map = magic.generateMap({ hires: true })
            }
          }
        }
      }
    }
  }
}
