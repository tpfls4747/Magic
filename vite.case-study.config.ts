import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config'

/**
 * Case Study 독립 미리보기용 빌드 설정.
 * 기존 vite.config.ts 를 수정하지 않고, 전시관(index.html)과 미리보기 페이지를 함께 빌드합니다.
 *
 *   npx vite --config vite.case-study.config.ts          (개발 서버)
 *   npx vite build --config vite.case-study.config.ts    (빌드 → dist/case-study-preview.html)
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    build: {
      rolldownOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          caseStudy: fileURLToPath(new URL('./case-study-preview.html', import.meta.url)),
        },
      },
    },
  }),
)
