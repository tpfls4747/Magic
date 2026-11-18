/**
 * About 독립 미리보기 진입점 — /about-preview.html
 * 메인 전시관(App.tsx)과 분리되어 있습니다.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import './preview.css'
import { AboutSection } from '../AboutSection'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <AboutSection id="about" />
    </main>
  </StrictMode>,
)
