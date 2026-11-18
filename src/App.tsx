import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { markIntroSeen, shouldPlayIntro } from '@/lib/introSession'
import { AtelierCanvas } from '@/scenes/AtelierCanvas'
import { ExhibitHoverLabel } from '@/sections/ExhibitHoverLabel'
import { HeroOverlay } from '@/sections/HeroOverlay'
import { OpeningIntro } from '@/sections/OpeningIntro'
import { ScrollTour } from '@/sections/ScrollTour'

/**
 * 첫 화면 흐름
 *  intro    황금 자물쇠 Intro 만 표시 (전시관은 아직 마운트하지 않음 — GPU 를 Intro 에 집중)
 *  covered  빛이 화면을 덮은 순간 전시관을 아래에 마운트, 첫 프레임이 그려지면 빛을 걷음
 *  gallery  Intro 언마운트(3D 리소스 해제), 전시관 조작 가능
 */
type Stage = 'intro' | 'covered' | 'gallery'

/** 빛이 화면을 덮은 뒤 최소한 머무는 시간 — Intro 의 자동 걷기와 같은 호흡 */
const MIN_COVER_MS = 220
/** 전시관 준비가 늦어지더라도 이 시간이 지나면 빛을 걷습니다 */
const MAX_COVER_MS = 4000

function App() {
  const [withIntro] = useState(shouldPlayIntro)
  const [stage, setStage] = useState<Stage>(withIntro ? 'intro' : 'gallery')
  const [galleryReady, setGalleryReady] = useState(false)
  const [minCoverDone, setMinCoverDone] = useState(false)
  const [coverTimedOut, setCoverTimedOut] = useState(false)

  // 새로고침해도 항상 전시관의 처음 화면(카메라 기본 위치)에서 시작
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // Intro 동안에는 아래에 준비 중인 전시관이 스크롤되지 않도록 고정
  // (overflow 를 바꾸면 스크롤바가 생기고 사라지며 화면이 흔들리므로 입력만 막습니다)
  useEffect(() => {
    if (stage === 'gallery') return
    const block = (e: Event) => e.preventDefault()
    const pin = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    window.addEventListener('wheel', block, { passive: false })
    window.addEventListener('touchmove', block, { passive: false })
    window.addEventListener('scroll', pin, { passive: true })
    return () => {
      window.removeEventListener('wheel', block)
      window.removeEventListener('touchmove', block)
      window.removeEventListener('scroll', pin)
    }
  }, [stage])

  const handleCovered = useCallback(() => {
    markIntroSeen()
    window.scrollTo(0, 0)
    setStage((s) => (s === 'intro' ? 'covered' : s))
  }, [])

  // 빛이 덮인 동안: 최소 유지 시간 + 안전 시간
  useEffect(() => {
    if (stage !== 'covered') return
    const hold = window.setTimeout(() => setMinCoverDone(true), MIN_COVER_MS)
    const safety = window.setTimeout(() => setCoverTimedOut(true), MAX_COVER_MS)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(safety)
    }
  }, [stage])

  const handleGalleryReady = useCallback(() => setGalleryReady(true), [])
  const revealSignal = stage === 'covered' && minCoverDone && (galleryReady || coverTimedOut)

  const handleComplete = useCallback(() => {
    window.scrollTo(0, 0)
    setStage('gallery')
  }, [])

  const handleIntroError = useCallback(() => {
    markIntroSeen()
    setStage('gallery')
  }, [])

  // Intro 를 지나온 뒤 초점을 전시관 제목으로 (스크린 리더가 새 화면을 읽기 시작하는 지점)
  useEffect(() => {
    if (!withIntro || stage !== 'gallery') return
    document.querySelector<HTMLElement>('[data-tour="hero-title"] h1')?.focus({ preventScroll: true })
  }, [withIntro, stage])

  return (
    <>
      {stage !== 'intro' && (
        // 빛이 걷히기 전까지는 조작·초점 이동을 막습니다
        <main inert={stage !== 'gallery'}>
          {/* 빛 아래에서 준비되는 동안에는 페이드 없이 바로 그림 (준비가 늦어 빛이 먼저 걷히면 평소처럼 서서히) */}
          <AtelierCanvas onReady={handleGalleryReady} fadeIn={stage !== 'covered' || revealSignal} />
          <HeroOverlay />
          <ScrollTour />
          <ExhibitHoverLabel />
        </main>
      )}
      {stage !== 'gallery' && (
        <OpeningIntro
          revealSignal={revealSignal}
          onCovered={handleCovered}
          onComplete={handleComplete}
          onError={handleIntroError}
        />
      )}
    </>
  )
}

export default App
