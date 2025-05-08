import { Dict } from 'cosmokit'
import type { } from 'cordis'

declare module 'cordis' {
  interface Context {
    $version: string
    dataDir: string
  }
}

export type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
export interface CordisConfig {
  duration?: boolean
  description?: string
  service?: {
    required?: string[]
    optional?: string[]
    implements?: string[]
  }
}

export interface PackageJson extends Partial<Record<DependencyType, Dict<string>>> {
  name: string
  type: 'module' | 'commonjs'
  main: string
  module?: string
  bin?: string | Dict<string>
  exports?: PackageJson.Exports
  description?: string
  private?: boolean
  version: string
  workspaces?: string[]
  scripts?: Dict<string>
  sapp?: CordisConfig
  cordis?: CordisConfig
  koishi?: CordisConfig
  peerDependenciesMeta?: Dict<{ optional?: boolean }>
}

export namespace PackageJson {
  export type Exports = string | { [key: string]: Exports }
}

export function emptyObject(obj: any) {
  for (const key in obj) {
    if (obj[key] !== undefined) {
      return false
    }
  }
  return true
}

export * from 'cosmokit'
