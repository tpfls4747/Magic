import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { Suspense, type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { createIntroAnim } from './animState'
import { emitIntroEvent, INTRO_EVENTS, type IntroCallbacks, type IntroPhase } from './events'
import { IntroScene } from './scene/IntroScene'
import { buildUnlockTimeline } from './timeline'
import './GoldenLockIntro.css'

export interface GoldenLockIntroProps extends IntroCallbacks {
  /**
   * true(기본): 빛이 화면을 덮은 뒤 스스로 걷히고 onComplete 를 호출합니다.
   * false: covered 상태에서 멈춥니다. 호스트(전시관)가 준비되면
   *        `revealSignal` 을 true 로 바꿔 빛을 걷어 주세요.
   */
  autoReveal?: boolean
  /** autoReveal=false 일 때, 이 값이 true 가 되면 빛이 걷히고 완료됩니다 */
  revealSignal?: boolean
  /** 건너뛰기 버튼 표시 (기본 true) */
  skippable?: boolean
  title?: string
  subtitle?: string
  className?: string
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
 * Unlock My World — 황금 자물쇠 Intro.
 * 전시관과 독립된 전체 화면 오버레이로, 이벤트(props/CustomEvent)로만 외부와 통신합니다.
 */
export function GoldenLockIntro({
  autoReveal = true,
  revealSignal,
  skippable = true,
  title = 'Unlock My World',
  subtitle = '황금 열쇠를 눌러 나의 세계를 열어 주세요',
  className,
  ...callbacks
}: GoldenLockIntroProps) {
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)')
  const lowQuality = useMedia('(max-width: 768px), (pointer: coarse)')

  const [phase, setPhaseState] = useState<IntroPhase>('idle')
  const [ready, setReady] = useState(false)
  const [anim] = useState(createIntroAnim)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const enteredRef = useRef(false)
  const startedRef = useRef(false)
  // 각 이벤트가 정확히 한 번만 발행되도록 보장 (건너뛰기·재렌더·수동 걷기와 겹쳐도)
  const firedRef = useRef(new Set<string>())
  const once = useCallback((key: string, fn: () => void) => {
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    fn()
  }, [])

  // 최신 콜백을 ref 로 보관 — 타임라인이 오래된 클로저를 잡지 않도록
  const cbRef = useRef(callbacks)
  useLayoutEffect(() => {
    cbRef.current = callbacks
  })

  const setPhase = useCallback((p: IntroPhase) => {
    setPhaseState(p)
    cbRef.current.onPhaseChange?.(p)
  }, [])

  const handleCreated = useCallback(() => {
    requestAnimationFrame(() => {
      setReady(true)
      if (enteredRef.current) return
      enteredRef.current = true
      cbRef.current.onEnter?.()
      emitIntroEvent(INTRO_EVENTS.enter)
    })
  }, [])

  const finish = useCallback(() => {
    once('complete', () => {
      setPhase('done')
      cbRef.current.onComplete?.()
      emitIntroEvent(INTRO_EVENTS.complete)
    })
  }, [once, setPhase])

  const reveal = useCallback(() => {
    if (!flashRef.current || firedRef.current.has('reveal')) return
    firedRef.current.add('reveal')
    setPhase('revealing')
    gsap.to(flashRef.current, {
      autoAlpha: 0,
      scale: 1.18,
      duration: reducedMotion ? 0.6 : 1.3,
      ease: 'power2.out',
      onComplete: finish,
    })
  }, [finish, reducedMotion, setPhase])

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setPhase('unlocking')
    cbRef.current.onUnlockStart?.()
    emitIntroEvent(INTRO_EVENTS.unlockStart)

    tlRef.current = buildUnlockTimeline(
      anim,
      { ui: uiRef.current, flash: flashRef.current, canvas: canvasRef.current },
      {
        onUnlocked: () =>
          once('unlocked', () => {
            cbRef.current.onUnlocked?.()
            emitIntroEvent(INTRO_EVENTS.unlocked)
          }),
        onZoom: () => setPhase('zooming'),
        onCovered: () =>
          once('covered', () => {
            setPhase('covered')
            cbRef.current.onCovered?.()
            emitIntroEvent(INTRO_EVENTS.covered)
          }),
        onRevealStart: () => {
          firedRef.current.add('reveal')
          setPhase('revealing')
        },
        onComplete: finish,
      },
      { reducedMotion, autoReveal },
    )
  }, [anim, autoReveal, finish, once, reducedMotion, setPhase])

  /** 건너뛰기: 같은 시퀀스를 빠르게 재생 (이벤트 순서·횟수는 그대로) */
  const skip = useCallback(() => {
    start()
    tlRef.current?.timeScale(4)
  }, [start])

  // Esc 키로도 건너뛰기
  useEffect(() => {
    if (!skippable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip, skippable])

  // autoReveal=false 일 때 호스트 신호로 걷기
  useEffect(() => {
    if (!autoReveal && revealSignal && phase === 'covered') reveal()
  }, [autoReveal, revealSignal, phase, reveal])

  useEffect(() => () => void tlRef.current?.kill(), [])

  const interactive = phase === 'idle'

  return (
    <div
      className={`gl-intro is-${phase}${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
      role="dialog"
      aria-modal={phase !== 'revealing' && phase !== 'done'}
      aria-label={title}
    >
      <div ref={canvasRef} className="gl-intro__canvas" aria-hidden="true">
        <Canvas
          // 빛이 화면을 덮은 뒤에는 캔버스가 숨겨지므로 렌더를 멈춰 GPU 를 아래 화면(전시관) 준비에 양보
          frameloop={phase === 'idle' || phase === 'unlocking' || phase === 'zooming' ? 'always' : 'never'}
          dpr={lowQuality ? [1, 1.5] : [1, 2]}
          camera={{ fov: 35, near: 0.05, far: 60, position: [0, 0.25, 7] }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            // Neutral: 금색의 색조를 보존 (ACES 의 노랑→갈색 변이 방지)
            toneMapping: THREE.NeutralToneMapping,
            toneMappingExposure: 1.0,
          }}
          onCreated={handleCreated}
        >
          <Suspense fallback={null}>
            <IntroScene
              anim={anim}
              animate={!reducedMotion}
              interactive={interactive}
              lowQuality={lowQuality}
              onActivate={start}
            />
          </Suspense>
        </Canvas>
      </div>

      <div ref={uiRef} className="gl-intro__ui">
        <p className="gl-intro__eyebrow">Portfolio · Atelier</p>
        <h1 className="gl-intro__title">{title}</h1>
        <p className="gl-intro__subtitle">{subtitle}</p>
        <button type="button" className="gl-intro__cta" onClick={start} disabled={!interactive}>
          <span className="gl-intro__cta-star" aria-hidden="true">✦</span>
          열쇠로 열기
        </button>
      </div>

      {skippable && (phase === 'idle' || phase === 'unlocking' || phase === 'zooming') && (
        <button type="button" className="gl-intro__skip" onClick={skip}>
          건너뛰기
        </button>
      )}

      <div ref={flashRef} className="gl-intro__flash" aria-hidden="true">
        <span className="gl-intro__flash-core" />
        <span className="gl-intro__flash-ring" />
        <span className="gl-intro__flash-rays" />
        <span className="gl-intro__flash-sparkles">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </span>
      </div>
    </div>
  )
}
