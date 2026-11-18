import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.ts'

/**
 * Process 독립 미리보기용 빌드 설정.
 * 기존 vite.config.ts 를 수정하지 않고, 전시관(index.html)과 Process 미리보기를 함께 빌드합니다.
 *
 *   npx vite build --config vite.process.config.ts    (→ dist/process-preview.html)
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      rolldownOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          process: fileURLToPath(new URL('./process-preview.html', import.meta.url)),
        },
      },
    },
  }),
)
