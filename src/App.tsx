import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { markIntroSeen, shouldPlayIntro } from '@/lib/introSession'
import { registerSpaceNavigator, SPACE_HASH, spaceFromLocation, type Space } from '@/lib/space'
import { GALLERY_STOP, setActiveStop, setHoveredProject } from '@/lib/tour'
import { canUseWebGL } from '@/lib/webgl'
import { AtelierCanvas } from '@/scenes/AtelierCanvas'
import { ExhibitHoverLabel } from '@/sections/ExhibitHoverLabel'
import { HeroOverlay } from '@/sections/HeroOverlay'
import { OpeningIntro } from '@/sections/OpeningIntro'
import { ScrollTour } from '@/sections/ScrollTour'
import { SpaceVeil, type VeilState } from '@/sections/SpaceVeil'

// 전시관 밖 공간(About 책상 · Process 보드)은 처음 방문할 때 불러옵니다
const DesignersDesk = lazy(() => import('@/sections/DesignersDesk'))
const ProcessBoard = lazy(() => import('@/sections/ProcessBoard'))
const ContactDoor = lazy(() => import('@/sections/ContactDoor'))

/**
 * 첫 화면 흐름
 *  intro    황금 자물쇠 Intro 만 표시 (공간은 아직 마운트하지 않음 — GPU 를 Intro 에 집중)
 *  covered  빛이 화면을 덮은 순간 공간(기본: 전시관)을 아래에 마운트, 첫 프레임이 그려지면 빛을 걷음
 *  gallery  Intro 언마운트(3D 리소스 해제), 공간 조작 가능
 *
 * 공간 전환 (전시관 ↔ 디자이너의 책상)
 *  한 번에 한 공간만 마운트합니다. 빛의 막이 화면을 덮으면 공간을 교체하고(이전 공간의 캔버스·스크롤 투어·
 *  이벤트는 언마운트로 정리), 새 공간의 첫 프레임이 그려지면 막을 걷습니다.
 */
type Stage = 'intro' | 'covered' | 'gallery'

/** 빛이 화면을 덮은 뒤 최소한 머무는 시간 — Intro 의 자동 걷기와 같은 호흡 */
const MIN_COVER_MS = 220
/** 새 공간의 준비가 늦어지더라도 이 시간이 지나면 빛을 걷습니다 */
const MAX_COVER_MS = 4000
/** 공간 전환 막이 덮이는 / 걷히는 시간 (SpaceVeil.css 와 같은 값) */
const veilTiming = (reduced: boolean) => (reduced ? { in: 180, out: 250 } : { in: 550, out: 750 })

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 공간마다 초점을 둘 제목 (스크린 리더가 새 화면을 읽기 시작하는 지점) */
function focusSpace(space: Space) {
  let target: HTMLElement | null
  if (space === 'desk') target = document.getElementById(SPACE_HASH.desk.slice(1))
  else if (space === 'process') {
    // Process 섹션에는 초점을 받을 요소가 없어 제목을 프로그램 초점 대상으로 지정
    target = document.getElementById(`${SPACE_HASH.process.slice(1)}-title`)
    target?.setAttribute('tabindex', '-1')
  } else if (space === 'contact') {
    // Contact 화면이 이미 나타났으면(동작 줄이기 · 3D 미지원) 그 제목으로, 아니면 섹션으로
    const title = document.querySelector<HTMLElement>('.cn-contact.is-open .cn-screen__title')
    target = title ?? document.getElementById(SPACE_HASH.contact.slice(1))
    if (!title) target?.setAttribute('tabindex', '-1')
  } else target = document.querySelector<HTMLElement>('[data-tour="hero-title"] h1')
  target?.focus({ preventScroll: true })
}

function App() {
  const [withIntro] = useState(shouldPlayIntro)
  const [webgl] = useState(canUseWebGL)
  const [stage, setStage] = useState<Stage>(withIntro ? 'intro' : 'gallery')
  const [minCoverDone, setMinCoverDone] = useState(false)
  const [coverTimedOut, setCoverTimedOut] = useState(false)

  // ── 공간
  const [space, setSpace] = useState<Space>(spaceFromLocation)
  /** 첫 프레임이 그려진 공간 (WebGL 이 없으면 대체 화면이 바로 보이므로 항상 준비됨) */
  const [readyFor, setReadyFor] = useState<Space | null>(null)
  const ready = !webgl || readyFor === space
  const [veil, setVeil] = useState<VeilState>('hidden')
  const [veilTarget, setVeilTarget] = useState<Space>('gallery')
  const [veilMinDone, setVeilMinDone] = useState(false)
  const [veilTimedOut, setVeilTimedOut] = useState(false)
  const spaceRef = useRef(space)
  const veilRef = useRef(veil)
  const stageRef = useRef(stage)
  useLayoutEffect(() => {
    spaceRef.current = space
    veilRef.current = veil
    stageRef.current = stage
  })

  // 새로고침해도 항상 공간의 처음 화면(카메라 기본 위치)에서 시작
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  // Intro 나 공간 전환 막이 덮인 동안에는 아래에서 준비 중인 공간이 스크롤되지 않도록 고정
  // (overflow 를 바꾸면 스크롤바가 생기고 사라지며 화면이 흔들리므로 입력만 막습니다)
  const covering = stage !== 'gallery' || veil !== 'hidden'
  useEffect(() => {
    if (!covering) return
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
  }, [covering])

  // ── Intro → 첫 공간
  const handleCovered = useCallback(() => {
    markIntroSeen()
    window.scrollTo(0, 0)
    setStage((s) => (s === 'intro' ? 'covered' : s))
  }, [])

  useEffect(() => {
    if (stage !== 'covered') return
    const hold = window.setTimeout(() => setMinCoverDone(true), MIN_COVER_MS)
    const safety = window.setTimeout(() => setCoverTimedOut(true), MAX_COVER_MS)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(safety)
    }
  }, [stage])

  const revealSignal = stage === 'covered' && minCoverDone && (ready || coverTimedOut)

  const handleComplete = useCallback(() => {
    window.scrollTo(0, 0)
    setStage('gallery')
  }, [])

  const handleIntroError = useCallback(() => {
    markIntroSeen()
    setStage('gallery')
  }, [])

  // ── 공간 전환
  /** 막으로 덮고 공간을 교체합니다. 전환 중이거나 이미 그 공간이면 무시 (연타·중복 요청 방지) */
  const transitionTo = useCallback((target: Space) => {
    if (stageRef.current !== 'gallery' || veilRef.current !== 'hidden' || target === spaceRef.current) return
    veilRef.current = 'in'
    setVeilTarget(target)
    setVeilMinDone(false)
    setVeilTimedOut(false)
    setVeil('in')
    window.setTimeout(() => {
      if (spaceRef.current === 'gallery') {
        // 전시관을 떠날 때 공유 상태 정리 — 돌아오면 전시관 전체 화면에서 다시 시작
        setHoveredProject(null)
        setActiveStop(GALLERY_STOP)
      }
      window.scrollTo(0, 0)
      setReadyFor(null)
      setSpace(target)
      setVeil('covered')
    }, veilTiming(prefersReducedMotion()).in)
  }, [])

  // 막이 덮인 동안: 새 공간의 첫 프레임 + 최소 유지 시간 → 걷기 (늦어지면 안전 시간 후 걷기)
  useEffect(() => {
    if (veil !== 'covered') return
    const hold = window.setTimeout(() => setVeilMinDone(true), MIN_COVER_MS)
    const safety = window.setTimeout(() => setVeilTimedOut(true), MAX_COVER_MS)
    return () => {
      window.clearTimeout(hold)
      window.clearTimeout(safety)
    }
  }, [veil])

  const lifting = veil === 'covered' && veilMinDone && (ready || veilTimedOut)
  useEffect(() => {
    if (!lifting) return
    const done = window.setTimeout(() => setVeil('hidden'), veilTiming(prefersReducedMotion()).out)
    return () => window.clearTimeout(done)
  }, [lifting])
  const veilShown: VeilState = lifting ? 'out' : veil

  /** 메뉴·버튼의 요청: 주소(해시)를 함께 바꿔 직접 진입과 브라우저 뒤로 가기도 같은 공간으로 */
  const requestSpace = useCallback(
    (target: Space) => {
      if (stageRef.current !== 'gallery' || veilRef.current !== 'hidden') return
      const here = spaceFromLocation()
      if (target === here) return
      if (target !== 'gallery') {
        // 전시관 → 공간: 기록을 하나 쌓음 / 공간 → 공간: 바꿔치기 (뒤로 가기는 항상 전시관으로)
        const state = { space: target, fromGallery: here === 'gallery' || window.history.state?.fromGallery === true }
        if (here === 'gallery') window.history.pushState(state, '', SPACE_HASH[target])
        else window.history.replaceState(state, '', SPACE_HASH[target])
      } else {
        // 전시관에서 들어왔다면 브라우저 기록을 되돌려(뒤로 가기와 같은 결과) popstate 에서 전환
        if (window.history.state?.fromGallery) {
          window.history.back()
          return
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      transitionTo(target)
    },
    [transitionTo],
  )

  useEffect(() => {
    registerSpaceNavigator(requestSpace)
    const sync = () => transitionTo(spaceFromLocation())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      registerSpaceNavigator(null)
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [requestSpace, transitionTo])

  // 전환이나 Intro 가 끝나면: 초점을 새 공간 제목으로, 그 사이 주소가 바뀌었으면 다시 맞춤
  const settled = stage === 'gallery' && veil === 'hidden'
  const wasCovered = useRef(withIntro)
  useEffect(() => {
    if (!settled) {
      wasCovered.current = true
      return
    }
    if (!wasCovered.current) return
    wasCovered.current = false
    focusSpace(space)
    if (spaceFromLocation() !== space) transitionTo(spaceFromLocation())
  }, [settled, space, transitionTo])

  const handleGalleryReady = useCallback(() => setReadyFor('gallery'), [])
  const handleDeskReady = useCallback(() => setReadyFor('desk'), [])
  const handleProcessReady = useCallback(() => setReadyFor('process'), [])
  const handleContactReady = useCallback(() => setReadyFor('contact'), [])
  const handleBack = useCallback(() => requestSpace('gallery'), [requestSpace])

  // 공간이 화면에 드러나기 시작했는지 (Intro 의 빛 · 전환 막이 걷히는 중이거나 다 걷힘) — Contact 문 자동 열림 시점
  const spaceRevealed = stage === 'gallery' ? veilShown === 'out' || veilShown === 'hidden' : stage === 'covered' && revealSignal

  // 빛이나 막 아래에서 준비되는 동안에는 페이드 없이 바로 그림 (준비가 늦어 먼저 걷히면 평소처럼 서서히)
  const hiddenUnderCover = (stage === 'covered' && !revealSignal) || veilShown === 'in' || veilShown === 'covered'

  return (
    <>
      {stage !== 'intro' && (
        // 빛이 걷히기 전까지는 조작·초점 이동을 막습니다
        <main inert={!settled}>
          {space === 'gallery' ? (
            <>
              <AtelierCanvas onReady={handleGalleryReady} fadeIn={!hiddenUnderCover} />
              <HeroOverlay />
              <ScrollTour />
              <ExhibitHoverLabel />
            </>
          ) : (
            <Suspense fallback={<div style={{ minHeight: '100vh', background: '#ece2d6' }} />}>
              {space === 'desk' && <DesignersDesk onReady={handleDeskReady} onBack={handleBack} />}
              {space === 'process' && <ProcessBoard onReady={handleProcessReady} onBack={handleBack} />}
              {space === 'contact' && <ContactDoor onReady={handleContactReady} onBack={handleBack} revealed={spaceRevealed} />}
            </Suspense>
          )}
        </main>
      )}
      <SpaceVeil state={veilShown} target={veilTarget} />
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
