export interface ExposedApi {
  native: ExposedNative
}

export interface ExposedNative { }

type Exposed = {
  [key in keyof ExposedApi]: ExposedApi[key]
}

declare global {
  interface Window extends Exposed { }
}
