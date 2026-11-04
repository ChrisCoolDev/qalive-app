import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  // ✅ Ne charger que les variables préfixées par VITE_ pour ne jamais exposer DATABASE_URL dans le bundle client
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_')

  return {
    plugins: [vue(), vueDevTools()],
    server: {
      host: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'process.env': env,
    },
  }
})
