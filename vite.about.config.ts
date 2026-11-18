import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.ts'

/**
 * About 독립 미리보기용 빌드 설정.
 * 기존 vite.config.ts 를 수정하지 않고, 전시관(index.html)과 About 미리보기를 함께 빌드합니다.
 *
 *   npx vite build --config vite.about.config.ts    (→ dist/about-preview.html)
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      rolldownOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          about: fileURLToPath(new URL('./about-preview.html', import.meta.url)),
        },
      },
    },
  }),
)
