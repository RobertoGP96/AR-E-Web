declare module 'tailwindcss' {
  import { Config } from 'tailwindcss/types'
  export * from 'tailwindcss/types'
  export default Config
}

declare module 'tailwindcss/types' {
  export interface Config {
    content?: string[]
    theme?: {
      extend?: Record<string, unknown>
    }
    plugins?: unknown[]
    darkMode?: 'media' | 'class' | ['class', string] | false
    prefix?: string
    important?: boolean | string
    separator?: string
    corePlugins?: Record<string, boolean> | string[]
  }
}
