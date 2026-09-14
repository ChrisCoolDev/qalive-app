import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfigFn from './vite.config.js'

export default defineConfig(async () => {
  const viteConfigObj = typeof viteConfigFn === 'function'
    ? await viteConfigFn({ mode: 'test', command: 'serve' })
    : viteConfigFn

  return mergeConfig(
    viteConfigObj,
    defineConfig({
      test: {
        environment: 'happy-dom',
        exclude: [...configDefaults.exclude, 'e2e/*'],
        root: fileURLToPath(new URL('./', import.meta.url)),
        setupFiles: ['./tests/setup.ts'],
      },
    })
  )
})
