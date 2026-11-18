/**
 * Contact 섹션 독립 미리보기 — 기존 앱(index.html / main.tsx / App.tsx)과 분리된 진입점.
 *
 *   npm run dev → http://localhost:5173/src/contact/preview/
 *
 * 쿼리
 *   ?debug                 이벤트 로그 표시
 *   ?email=a@b.com&linkedin=https://...   연락처가 연결된 상태 미리보기 (저장되지 않음)
 */
import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import { gsap } from 'gsap'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { doorClock } from '../animState'
import { ContactSection, CONTACT_EVENTS, type DoorPhase } from '../index'
import './preview.css'

const params = new URLSearchParams(location.search)
const debug = params.has('debug')
const links = {
  ...(params.get('email') ? { email: params.get('email')! } : {}),
  ...(params.get('linkedin') ? { linkedin: params.get('linkedin')! } : {}),
}
if (debug) Object.assign(window, { __gsap: gsap, __doorClock: doorClock })

for (const name of Object.values(CONTACT_EVENTS)) {
  window.addEventListener(name, () => console.info('[contact event]', name))
}

function Preview() {
  const [phase, setPhase] = useState<DoorPhase>('closed')
  const [log, setLog] = useState<string[]>([])
  const push = (s: string) => {
    setLog((l) => [...l.slice(-7), s])
    const w = window as unknown as { __contactEvents?: Record<string, number> }
    w.__contactEvents = { ...w.__contactEvents, [s]: (w.__contactEvents?.[s] ?? 0) + 1 }
  }
  return (
    <>
      <ContactSection
        links={links}
        onPhaseChange={setPhase}
        onOpenStart={(m) => push(`onOpenStart:${m}`)}
        onOpened={() => push('onOpened')}
        onCloseStart={() => push('onCloseStart')}
        onClosed={() => push('onClosed')}
        onBackToBeginning={() => {
          push('onBackToBeginning')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onContactClick={(m) => push(`onContactClick:${m}`)}
      />
      {debug && (
        <aside className="preview-log">
          <strong>phase: {phase}</strong>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </aside>
      )}
    </>
  )
}

createRoot(document.getElementById('contact-preview-root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
