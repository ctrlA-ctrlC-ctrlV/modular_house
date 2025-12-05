import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modular-house/ui/style.css': path.resolve(__dirname, './src/test/empty.css'),
      '@modular-house/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})