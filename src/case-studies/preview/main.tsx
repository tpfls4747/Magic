/**
 * 독립 미리보기 진입점 — /case-study-preview.html
 * 메인 전시관(App.tsx)과 완전히 분리되어 있습니다.
 *
 *   /case-study-preview.html?project=seat-swap
 *   /case-study-preview.html?project=signup-redesign
 *   /case-study-preview.html?project=web-prototype
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import './preview.css'
import { CaseStudyApp } from '../CaseStudyApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaseStudyApp exhibitionHref="/" />
  </StrictMode>,
)
