/**
 * 황금 자물쇠 Intro 독립 미리보기.
 * 기존 앱(index.html / main.tsx / App.tsx)과 완전히 분리된 진입점입니다.
 *
 *   npm run dev → http://localhost:5173/src/intro/preview/
 *
 * 쿼리 옵션
 *   ?reveal=manual  빛이 화면을 덮은 상태에서 멈추고, "전시관 준비 완료" 버튼으로 걷기
 *   ?debug          이벤트 로그 패널 표시
 *   ?slow=0.25      해제 시퀀스를 느리게 재생 (연출 점검용)
 */
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { gsap } from 'gsap'
import { GoldenLockIntro, INTRO_EVENTS, type IntroPhase } from '../index'
import './preview.css'

const params = new URLSearchParams(location.search)
const manualReveal = params.get('reveal') === 'manual'
const debug = params.has('debug')
const slow = Number(params.get('slow'))
if (slow > 0) {
  gsap.globalTimeline.timeScale(slow)
  gsap.ticker.lagSmoothing(0)
}
// 디버그 시 콘솔/자동화 도구에서 타임라인을 직접 제어할 수 있도록 노출
if (debug) Object.assign(window, { __gsap: gsap })

// window CustomEvent 연결 예시 (props 콜백 대신 사용할 수 있음)
for (const name of Object.values(INTRO_EVENTS)) {
  window.addEventListener(name, () => console.info('[intro event]', name))
}

function Preview() {
  const [run, setRun] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [showExhibition, setShowExhibition] = useState(false)
  const [revealSignal, setRevealSignal] = useState(false)
  const [phase, setPhase] = useState<IntroPhase>('idle')
  const [log, setLog] = useState<string[]>([])
  const push = (s: string) => setLog((l) => [...l, `${(performance.now() / 1000).toFixed(2)}s  ${s}`])

  const replay = () => {
    setShowExhibition(false)
    setRevealSignal(false)
    setLog([])
    setShowIntro(true)
    setRun((r) => r + 1)
  }

  return (
    <>
      {showExhibition && (
        <main className="preview-exhibition">
          <p className="preview-exhibition__eyebrow">placeholder</p>
          <h2>The Floating Atelier</h2>
          <p>
            실제 연결 시 이 자리에 기존 3D 전시관이 <code>onCovered</code> 시점에 마운트됩니다.
          </p>
          <button type="button" onClick={replay}>
            Intro 다시 보기
          </button>
        </main>
      )}

      {showIntro && (
        <GoldenLockIntro
          key={run}
          autoReveal={!manualReveal}
          revealSignal={revealSignal}
          onEnter={() => push('onEnter')}
          onUnlockStart={() => push('onUnlockStart')}
          onUnlocked={() => push('onUnlocked')}
          onCovered={() => {
            push('onCovered → 전시관 마운트')
            setShowExhibition(true)
          }}
          onComplete={() => {
            push('onComplete → Intro 언마운트')
            setShowIntro(false)
          }}
          onPhaseChange={setPhase}
        />
      )}

      {manualReveal && phase === 'covered' && (
        <button type="button" className="preview-manual" onClick={() => setRevealSignal(true)}>
          전시관 준비 완료 → 빛 걷기
        </button>
      )}

      {debug && (
        <aside className="preview-log" aria-live="polite">
          <strong>phase: {phase}</strong>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </aside>
      )}
    </>
  )
}

createRoot(document.getElementById('intro-preview-root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
