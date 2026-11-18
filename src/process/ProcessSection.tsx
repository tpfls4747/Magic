import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useMediaQuery, usePrefersReducedMotion, useQuality } from '@/hooks/useMediaQuery'
import { ProcessTextView } from './components/ProcessTextView'
import { StageDetail } from './components/StageDetail'
import { StageNav } from './components/StageNav'
import { TextValue } from './components/TextValue'
import { processContent as defaultContent } from './data/processContent'
import { hasWebGL, useInView } from './hooks/useProcessEnv'
import type { ProcessContent } from './types'
import './styles/process.css'

// three.js 장면은 별도 청크 — Process 가 화면에 들어올 때 불러옵니다
const ProcessCanvas = lazy(() => import('./scene/ProcessCanvas').then((m) => ({ default: m.ProcessCanvas })))

export interface ProcessSectionProps {
  /** 콘텐츠 (기본값: data/processContent.ts) */
  content?: ProcessContent
  /** 섹션 id — 메인 내비게이션 앵커로 사용 */
  id?: string
  className?: string
  /** 보드 장면의 첫 프레임들이 그려진 뒤 한 번 호출 (3D 를 쓸 수 없으면 바로) — 화면 전환을 걷는 시점 */
  onReady?: () => void
}

/**
 * Process — How I Create / The Process Board.
 *
 * 3D 디자인 보드 위의 단계 카드와 자료가 인터페이스로 동작합니다.
 * - 카드 호버: 보드에서 떠오르며 금박 옆면이 빛남
 * - 카드 선택: 보드에서 분리되어 카메라 앞으로 날아오고, 상세 정보는 HTML 패널로 표시
 * - 금실로 이어진 단계 사이에 빛이 흐르며 다음 단계를 가리킴
 * - 같은 동작을 하는 바로가기 메뉴 · 이전/다음 · 전체 보드 · Esc · 텍스트 보기 제공
 */
export function ProcessSection({ content = defaultContent, id = 'process', className = '', onReady }: ProcessSectionProps) {
  const reducedMotion = usePrefersReducedMotion()
  const quality = useQuality()
  const narrow = useMediaQuery('(max-width: 760px), (max-aspect-ratio: 4/5)')
  // 충분히 넓은 화면에서는 소개 글을 왼쪽 열에, 보드를 오른쪽에
  const wide = useMediaQuery('(min-aspect-ratio: 3/2) and (min-width: 1100px)')
  const [webgl] = useState(hasWebGL)

  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const inView = useInView(rootRef)

  const [selected, setSelected] = useState<number | null>(null)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [textOpen, setTextOpen] = useState(!webgl)
  const lastSelected = useRef<number | null>(null)
  const returnFocus = useRef(false)

  const count = content.stages.length
  const titleId = `${id}-title`
  const textId = `${id}-text`

  const select = useCallback((i: number) => {
    setSelected(i)
    setHighlighted(null)
  }, [])

  const close = useCallback(() => {
    returnFocus.current = true
    setSelected(null)
  }, [])

  const step = useCallback(
    (dir: 1 | -1) =>
      setSelected((s) => (s === null ? s : Math.min(count - 1, Math.max(0, s + dir)))),
    [count],
  )

  useEffect(() => {
    if (selected !== null) lastSelected.current = selected
  }, [selected])

  // 좁은 화면: 단계를 열면 3D 카드와 읽기 시트가 함께 보이도록 스크롤
  const wasOpen = useRef(false)
  useEffect(() => {
    const isOpen = selected !== null
    if (narrow && isOpen && !wasOpen.current) {
      stageRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
    wasOpen.current = isOpen
  }, [selected, narrow, reducedMotion])

  // 닫으면 마지막으로 보던 단계의 바로가기 버튼으로 포커스 복귀
  useEffect(() => {
    if (selected !== null || !returnFocus.current) return
    returnFocus.current = false
    const i = lastSelected.current
    const btn = i !== null ? rootRef.current?.querySelectorAll<HTMLButtonElement>('.pr-step')[i] : null
    ;(btn ?? startRef.current)?.focus({ preventScroll: true })
  }, [selected])

  // 상세 화면 키보드: Esc 닫기, ← → 단계 이동
  useEffect(() => {
    if (selected === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, close, step])

  const showText = useCallback(() => {
    setTextOpen(true)
    requestAnimationFrame(() => {
      textRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
      textRef.current?.focus({ preventScroll: true })
    })
  }, [reducedMotion])

  // 3D 없이 텍스트로 보여 주는 환경에서는 바로 준비 완료
  useEffect(() => {
    if (!webgl) onReady?.()
  }, [webgl, onReady])

  const open = selected !== null
  const stage = open ? content.stages[selected] : null

  const intro = (
    <div className="pr-intro" aria-hidden={open && !narrow}>
      <p className="pr-eyebrow">
        <span>Process</span>
        <span className="pr-eyebrow__rule" aria-hidden="true" />
        <span>How I Create</span>
      </p>
      <h2 id={titleId} className="pr-title">
        The Process <em>Board</em>
      </h2>
      <p className="pr-lead">
        <TextValue value={content.lead} />
      </p>
      <div className="pr-actions">
        {webgl && (
          <button
            ref={startRef}
            type="button"
            className="pr-button pr-button--primary"
            onClick={() => select(0)}
            tabIndex={open && !narrow ? -1 : 0}
          >
            Start with Discover
            <span aria-hidden="true">→</span>
          </button>
        )}
        <button
          type="button"
          className="pr-button pr-button--ghost"
          onClick={showText}
          aria-controls={textId}
          aria-expanded={textOpen}
          tabIndex={open && !narrow ? -1 : 0}
        >
          전체 과정 텍스트로 보기
        </button>
      </div>
      <p className="pr-intro__note">{content.note}</p>
    </div>
  )

  const nav = (compact: boolean) => (
    <StageNav
      stages={content.stages}
      selected={selected}
      highlighted={highlighted}
      compact={compact}
      onHighlight={setHighlighted}
      onSelect={select}
      onOverview={close}
    />
  )

  return (
    <section
      ref={rootRef}
      id={id}
      className={`pr-root ${open ? 'is-open' : ''} ${narrow ? 'is-narrow' : ''} ${wide ? 'is-wide' : ''} ${
        highlighted !== null && !open ? 'is-pointing' : ''
      } ${className}`.trim()}
      aria-labelledby={titleId}
    >
      {narrow && intro}

      <div ref={stageRef} className="pr-stage">
        {webgl ? (
          <Suspense fallback={<div className="pr-stage__loading" aria-hidden="true" />}>
            <ProcessCanvas
              content={content}
              orientation={narrow ? 'portrait' : 'landscape'}
              quality={quality}
              selected={selected}
              highlighted={highlighted}
              reducedMotion={reducedMotion}
              active={inView}
              focus={narrow ? { offsetX: 0, fill: 0.74 } : { offsetX: -0.17, fill: 0.6 }}
              insets={narrow ? { left: 0, top: 0, bottom: 0 } : wide ? { left: 0.25, top: 0.02, bottom: 0.1 } : { left: 0, top: 0.3, bottom: 0.1 }}
              onHover={setHighlighted}
              onSelect={select}
              onReady={onReady}
            />
          </Suspense>
        ) : (
          <div className="pr-stage__fallback" aria-hidden="true" />
        )}

        {!narrow && intro}
        {webgl && !narrow && nav(false)}
        {webgl && stage && !narrow && selected !== null && (
          <StageDetail
            stage={stage}
            index={selected}
            total={count}
            note={content.note}
            sheet={false}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onClose={close}
          />
        )}
      </div>

      {webgl && narrow && !open && <div className="pr-navbar">{nav(false)}</div>}

      {webgl && stage && narrow && selected !== null && (
        <div className="pr-sheet">
          {nav(true)}
          <StageDetail
            stage={stage}
            index={selected}
            total={count}
            note={content.note}
            sheet
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onClose={close}
          />
        </div>
      )}

      <div hidden={!textOpen}>
        <ProcessTextView ref={textRef} content={content} id={textId} />
      </div>
    </section>
  )
}
