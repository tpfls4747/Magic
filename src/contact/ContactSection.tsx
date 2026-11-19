import { Canvas, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import * as THREE from 'three'
import { createDoorAnim } from './animState'
import { ContactPanel } from './components/ContactPanel'
import { ContactScreen } from './components/ContactScreen'
import { CONTACT_CONTENT, type ContactContent } from './data/content'
import { CONTACT_LINKS, type ContactLinks } from './data/links'
import { CONTACT_EVENTS, emitContactEvent, type ContactCallbacks, type DoorPhase } from './events'
import { DoorScene } from './scene/DoorScene'
import { buildCloseTimeline, buildEnterTimeline, buildOpenTimeline, ENTER_TIMING } from './timeline'
import './styles/contact.css'

export interface ContactSectionProps extends ContactCallbacks {
  /** 문구 일부 덮어쓰기 (기본값: data/content.ts) */
  content?: Partial<ContactContent>
  /** 연락처 덮어쓰기 (기본값: data/links.ts) */
  links?: Partial<ContactLinks>
  /** section 의 id (내비게이션 앵커용) */
  id?: string
  className?: string
  /** 문 장면의 첫 프레임들이 그려진 뒤 한 번 호출 (3D 없이 표시하면 바로) — 화면 전환을 걷는 시점 */
  onReady?: () => void
  /** false: 3D 문 없이 소개 · 버튼 · 연락처만 표시 (WebGL 을 쓸 수 없을 때). 기본: 지원 여부 자동 확인 */
  webgl?: boolean
  /**
   * true 가 되면 문이 스스로 열리고, 카메라가 열린 문을 지나 문 너머로 들어간 뒤
   * Contact 전용 화면(ContactScreen)이 나타납니다 (사이트에서는 공간 전환의 빛이 걷히는 순간).
   * 자동 모드에서는 '문 열기 · 바로 보기 · 닫기' 같은 수동 조작이 없고, 들어온 뒤 문은 다시 나타나지 않습니다.
   * false/생략: 원래의 수동 흐름과 연락처 패널 (독립 미리보기)
   */
  autoOpen?: boolean
  /** 자동 모드에서 진입 연출을 시작해도 되는지 (기본 true) — 사이트는 공간 전환의 빛이 걷히기 시작할 때 true */
  startSignal?: boolean
}

/** 닫힌 문을 잠깐 보여 준 뒤 열기 시작 (초) — 빛이 걷히는 동안 문이 이미 열려 버리지 않도록 */
const AUTO_OPEN_DELAY = 0.6

function canUseWebGL() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

/** 셰이더 컴파일과 첫 렌더가 끝난 뒤(몇 프레임 후) 한 번 알림 */
function FirstFrames({ onDone }: { onDone?: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current > 3) return
    frames.current += 1
    if (frames.current === 3) onDone?.()
  })
  return null
}

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * Unlock My World — Contact · Open the Next Door.
 * 실제 3D 아치형 문을 열면 연락처가 나타나는 마지막 섹션. 독립 모듈로, 이벤트로만 외부와 통신합니다.
 */
export function ContactSection({ content: contentOverride, links: linksOverride, id = 'contact', className, onReady, webgl: webglProp, autoOpen = false, startSignal = true, ...callbacks }: ContactSectionProps) {
  const content = useMemo(() => ({ ...CONTACT_CONTENT, ...contentOverride }), [contentOverride])
  const links = useMemo(() => ({ ...CONTACT_LINKS, ...linksOverride }), [linksOverride])
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const lowQuality = useMedia('(max-width: 768px), (pointer: coarse)')

  const [webglSupported] = useState(() => webglProp ?? canUseWebGL())
  const webgl = webglProp ?? webglSupported
  const [anim] = useState(createDoorAnim)
  const [phase, setPhaseState] = useState<DoorPhase>('closed')
  const phaseRef = useRef<DoorPhase>('closed')
  const [announce, setAnnounce] = useState('')
  const [ready, setReady] = useState(false)
  /** 문 장면의 첫 프레임들이 실제로 그려졌는지 — 자동 열림은 이 뒤에 시작 */
  const [drawn, setDrawn] = useState(false)
  const handleDrawn = useCallback(() => {
    setDrawn(true)
    onReady?.()
  }, [onReady])
  const [visible, setVisible] = useState(true)
  /** 자동 진입이 끝나 Contact 화면만 남음 — 3D 문 장면은 언마운트해 GPU 를 비움 (문은 다시 나타나지 않음) */
  const [arrived, setArrived] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)

  const sectionRef = useRef<HTMLElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const headlineId = useId()
  const titleId = useId()
  const hintId = useId()

  const cbRef = useRef(callbacks)
  useLayoutEffect(() => {
    cbRef.current = callbacks
  })

  const setPhase = useCallback((p: DoorPhase) => {
    phaseRef.current = p
    setPhaseState(p)
    cbRef.current.onPhaseChange?.(p)
  }, [])

  // 패널 · Contact 화면은 처음엔 숨김 (GSAP autoAlpha → visibility:hidden 이라 화면 낭독기·탭 이동에서도 제외)
  useLayoutEffect(() => {
    gsap.set([panelRef.current, screenRef.current].filter(Boolean), { autoAlpha: 0 })
  }, [])

  // 화면 밖에 있을 때는 렌더 루프를 멈춰 성능 확보
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => () => void tlRef.current?.kill(), [])

  // 3D 없이 표시할 때는 바로 준비 완료
  useEffect(() => {
    if (!webgl) onReady?.()
  }, [webgl, onReady])

  const targets = () => ({ intro: introRef.current, cta: ctaRef.current, panel: panelRef.current })

  const open = useCallback(
    (mode: 'cinematic' | 'instant' = 'cinematic') => {
      const p = phaseRef.current
      if (p === 'open' || p === 'opening') return
      tlRef.current?.kill()
      setPhase('opening')
      setAnnounce('')
      cbRef.current.onOpenStart?.(mode)
      emitContactEvent(CONTACT_EVENTS.openStart)
      const tl = buildOpenTimeline(anim, targets(), mode, reduced)
      tl.eventCallback('onComplete', () => {
        setPhase('open')
        setAnnounce(content.a11y.opened)
        // 화면 낭독기·키보드 사용자가 곧바로 연락처를 읽을 수 있도록
        document.getElementById(titleId)?.focus({ preventScroll: true })
        cbRef.current.onOpened?.()
        emitContactEvent(CONTACT_EVENTS.opened)
      })
      tlRef.current = tl
    },
    [anim, content.a11y.opened, reduced, setPhase, titleId],
  )

  /** 자동 진입 마무리 — Contact 화면을 확정하고 문 장면을 정리 */
  const arrive = useCallback(() => {
    if (phaseRef.current === 'open') return
    gsap.set(screenRef.current, { autoAlpha: 1 })
    gsap.set(screenRef.current?.querySelectorAll('[data-stagger]') ?? [], { autoAlpha: 1, y: 0 })
    gsap.set(introRef.current, { autoAlpha: 0 })
    setPhase('open')
    setArrived(true)
    setAnnounce(content.a11y.opened)
    // 사용자가 그사이 다른 곳으로 옮긴 초점은 빼앗지 않음
    const active = document.activeElement
    if (!active || active === document.body || active === sectionRef.current) {
      document.getElementById(titleId)?.focus({ preventScroll: true })
    }
    cbRef.current.onOpened?.()
    emitContactEvent(CONTACT_EVENTS.opened)
  }, [content.a11y.opened, setPhase, titleId])

  /** 자동 진입: 문이 스스로 열림 → 카메라가 문을 지나 전진 → Contact 화면 (동작 줄이기 · 3D 없음: 곧바로) */
  const enter = useCallback(() => {
    const p = phaseRef.current
    if (p === 'open' || p === 'opening') return
    tlRef.current?.kill()
    setPhase('opening')
    setAnnounce('')
    const instant = reduced || !webgl
    cbRef.current.onOpenStart?.(instant ? 'instant' : 'cinematic')
    emitContactEvent(CONTACT_EVENTS.openStart)
    const compact = window.matchMedia('(max-aspect-ratio: 9/10)').matches
    const tl = buildEnterTimeline(anim, { intro: introRef.current, screen: screenRef.current }, { reduced: instant, compact })
    tl.eventCallback('onComplete', arrive)
    tlRef.current = tl
  }, [anim, arrive, reduced, setPhase, webgl])

  const close = useCallback(() => {
    const p = phaseRef.current
    if (p === 'closed' || p === 'closing') return
    tlRef.current?.kill()
    setPhase('closing')
    setAnnounce('')
    cbRef.current.onCloseStart?.()
    emitContactEvent(CONTACT_EVENTS.closeStart)
    const tl = buildCloseTimeline(anim, targets(), reduced)
    tl.eventCallback('onComplete', () => {
      setPhase('closed')
      setAnnounce(content.a11y.closed)
      const active = document.activeElement
      if (!active || active === document.body || panelRef.current?.contains(active)) {
        // 버튼의 disabled 해제가 반영된 다음 프레임에 포커스
        requestAnimationFrame(() => ctaButtonRef.current?.focus({ preventScroll: true }))
      }
      cbRef.current.onClosed?.()
      emitContactEvent(CONTACT_EVENTS.closed)
    })
    tlRef.current = tl
  }, [anim, content.a11y.closed, reduced, setPhase])

  const back = useCallback(() => {
    cbRef.current.onBackToBeginning?.()
    emitContactEvent(CONTACT_EVENTS.back)
    close()
  }, [close])

  // 자동 진입: 빛이 걷히면 (3D 가 없으면 바로) 시작
  const autoStarted = useRef(false)
  useEffect(() => {
    // 도착하면(arrived) 정리 함수가 돌아 남은 안전 타이머까지 해제됨
    if (!autoOpen || !startSignal || autoStarted.current || arrived) return
    if (webgl && !drawn) return
    autoStarted.current = true
    const delay = !webgl || reduced ? 0 : AUTO_OPEN_DELAY * 1000
    const start = window.setTimeout(enter, delay)
    // 안전장치: 어떤 이유로든 연출이 끝나지 않으면 Contact 화면을 곧바로 표시
    const longest = ENTER_TIMING.passStart.wide + ENTER_TIMING.passDuration.wide + 1.2
    const safety = window.setTimeout(
      () => {
        if (phaseRef.current === 'open') return
        tlRef.current?.kill()
        arrive()
      },
      delay + (longest + 2.5) * 1000,
    )
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(safety)
      // 아직 시작하지 않았다면 다음 실행에서 다시 시작 (개발 모드의 이중 실행 대비)
      if (phaseRef.current === 'closed') autoStarted.current = false
    }
  }, [autoOpen, startSignal, drawn, webgl, reduced, enter, arrive, arrived])

  // ESC 로 닫기 (수동 모드만 — 자동 모드에서는 문이 열린 채 연락처가 머묾)
  useEffect(() => {
    if (autoOpen) return
    if (phase !== 'open' && phase !== 'opening') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [autoOpen, phase, close])

  const setHover = useCallback(
    (on: boolean) => {
      if (phaseRef.current !== 'closed') return
      gsap.to(anim, { hover: on ? 1 : 0, duration: on ? 0.35 : 0.6, ease: 'power2.out', overwrite: 'auto' })
      if (sectionRef.current) sectionRef.current.style.cursor = on ? 'pointer' : ''
    },
    [anim],
  )

  const [first, ...rest] = content.headlineLines

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`cn-contact is-${phase}${ready || !webgl ? ' is-ready' : ''}${webgl ? '' : ' is-flat'}${autoOpen ? ' is-auto' : ''}${className ? ` ${className}` : ''}`}
      aria-label={content.a11y.sectionLabel}
    >
      <div className="cn-canvas" aria-hidden="true">
        {webgl && !arrived && (
        <Canvas
          // three r187 에서 PCFSoft 가 제거되어 어차피 PCF 로 대체됨 — 같은 결과를 직접 지정해 콘솔 경고 제거
          shadows={!lowQuality ? 'percentage' : false}
          frameloop={visible ? 'always' : 'never'}
          dpr={lowQuality ? [1, 1.5] : [1, 2]}
          camera={{ fov: 35, near: 0.1, far: 80, position: [0, 2.4, 12] }}
          gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
          onCreated={() => requestAnimationFrame(() => setReady(true))}
        >
          <Suspense fallback={null}>
            <DoorScene
              anim={anim}
              animate={!reduced}
              lowQuality={lowQuality}
              interactive={phase === 'closed'}
              onActivate={() => (autoOpen ? enter() : open('cinematic'))}
              onHover={setHover}
              framing={autoOpen ? 'pass' : 'side'}
            />
            <FirstFrames onDone={handleDrawn} />
          </Suspense>
        </Canvas>
        )}
      </div>

      <div ref={introRef} className="cn-intro">
        <p className="cn-eyebrow">{content.eyebrow}</p>
        <h2 id={headlineId} className="cn-headline">
          <span>{first}</span>
          {rest.map((line) => (
            <em key={line}>{line}</em>
          ))}
        </h2>
        <p className="cn-subtitle">{content.subtitle}</p>
      </div>

      <div ref={ctaRef} className="cn-cta-row">
        {!autoOpen && (
          <>
        <button
          ref={ctaButtonRef}
          type="button"
          className="cn-cta"
          onClick={() => open('cinematic')}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-describedby={hintId}
          disabled={phase !== 'closed'}
        >
          <span className="cn-cta__glyph" aria-hidden="true" />
          {content.cta}
        </button>
        <button type="button" className="cn-quick" onClick={() => open('instant')} disabled={phase !== 'closed'}>
          {content.quickView}
        </button>
        <p id={hintId} className="cn-sr">
          {content.a11y.doorHint}
        </p>
          </>
        )}
      </div>

      {autoOpen ? (
        <ContactScreen
          ref={screenRef}
          content={content}
          links={links}
          titleId={titleId}
          onContactClick={(m) => cbRef.current.onContactClick?.(m)}
        />
      ) : (
        <ContactPanel
          ref={panelRef}
          content={content}
          links={links}
          titleId={titleId}
          onClose={close}
          onBack={back}
          onContactClick={(m) => cbRef.current.onContactClick?.(m)}
        />
      )}

      <p className="cn-sr" aria-live="polite">
        {announce}
      </p>
    </section>
  )
}
