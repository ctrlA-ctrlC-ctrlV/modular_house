import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { imagetools } from 'vite-imagetools'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),

      /**
       * vite-imagetools — build-time image transformation pipeline.
       *
       * Enables query-string-driven image transforms on any imported asset, for
       * example:
       *   import heroWebP from './hero.png?format=webp&width=1440'
       *
       * This plugin runs Sharp under the hood, so it only applies to images that
       * are imported via JS/TS modules — NOT to files in the /public directory.
       * Images in /public are served verbatim by the dev server and copied as-is
       * during the build.  To benefit from format conversion for those assets you
       * must either:
       *   (a) move them to /src/assets/ and import them, or
       *   (b) run a separate offline optimisation step (e.g. squoosh / imagemin).
       *
       * The `defaultDirectives` function is intentionally left absent here so that
       * transforms are always explicit at the call site, which makes the intent of
       * each image import self-documenting and easy to audit.
       *
       * Type assertion required due to minor type incompatibility between
       * vite-imagetools 6.x and Vite 6.x Plugin interface versions.
       */
      imagetools() as PluginOption,
    ],
    resolve: {
      alias: {
        "@modular-house/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts")
      }
    },
    server: {
      port: 3000,
      host: true
    },
    // Configuration for the Server-Side Rendering (SSR) build.
    // Ensure dependencies are correctly handled during the SSG prerender step.
    ssr: {
      noExternal: ['react-helmet-async']
    },
    build: {
      outDir: 'dist',
      sourcemap: env.GENERATE_SOURCEMAP !== 'false'
    }
  }
})