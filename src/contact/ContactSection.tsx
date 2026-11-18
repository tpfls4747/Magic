import { Canvas } from '@react-three/fiber'
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
import { CONTACT_CONTENT, type ContactContent } from './data/content'
import { CONTACT_LINKS, type ContactLinks } from './data/links'
import { CONTACT_EVENTS, emitContactEvent, type ContactCallbacks, type DoorPhase } from './events'
import { DoorScene } from './scene/DoorScene'
import { buildCloseTimeline, buildOpenTimeline } from './timeline'
import './styles/contact.css'

export interface ContactSectionProps extends ContactCallbacks {
  /** 문구 일부 덮어쓰기 (기본값: data/content.ts) */
  content?: Partial<ContactContent>
  /** 연락처 덮어쓰기 (기본값: data/links.ts) */
  links?: Partial<ContactLinks>
  /** section 의 id (내비게이션 앵커용) */
  id?: string
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
 * Unlock My World — Contact · Open the Next Door.
 * 실제 3D 아치형 문을 열면 연락처가 나타나는 마지막 섹션. 독립 모듈로, 이벤트로만 외부와 통신합니다.
 */
export function ContactSection({ content: contentOverride, links: linksOverride, id = 'contact', className, ...callbacks }: ContactSectionProps) {
  const content = useMemo(() => ({ ...CONTACT_CONTENT, ...contentOverride }), [contentOverride])
  const links = useMemo(() => ({ ...CONTACT_LINKS, ...linksOverride }), [linksOverride])
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const lowQuality = useMedia('(max-width: 768px), (pointer: coarse)')

  const [anim] = useState(createDoorAnim)
  const [phase, setPhaseState] = useState<DoorPhase>('closed')
  const phaseRef = useRef<DoorPhase>('closed')
  const [announce, setAnnounce] = useState('')
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(true)

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

  // 패널은 처음엔 숨김 (GSAP autoAlpha → visibility:hidden 이라 화면 낭독기·탭 이동에서도 제외)
  useLayoutEffect(() => {
    gsap.set(panelRef.current, { autoAlpha: 0 })
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

  // ESC 로 닫기
  useEffect(() => {
    if (phase !== 'open' && phase !== 'opening') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, close])

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
      className={`cn-contact is-${phase}${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
      aria-label={content.a11y.sectionLabel}
    >
      <div className="cn-canvas" aria-hidden="true">
        <Canvas
          shadows={!lowQuality ? 'soft' : false}
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
              onActivate={() => open('cinematic')}
              onHover={setHover}
            />
          </Suspense>
        </Canvas>
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
      </div>

      <ContactPanel
        ref={panelRef}
        content={content}
        links={links}
        titleId={titleId}
        onClose={close}
        onBack={back}
        onContactClick={(m) => cbRef.current.onContactClick?.(m)}
      />

      <p className="cn-sr" aria-live="polite">
        {announce}
      </p>
    </section>
  )
}
