import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@modular-house/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts")
      }
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: env.GENERATE_SOURCEMAP !== 'false'
    }
  }
})