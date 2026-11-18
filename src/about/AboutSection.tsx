import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useMediaQuery, usePrefersReducedMotion, useQuality } from '@/hooks/useMediaQuery'
import { aboutContent as defaultContent } from './data/aboutContent'
import { hasWebGL, useInView } from './hooks/useAboutEnv'
import { createDiaryAnim } from './scene/diaryAnim'
import type { AboutContent, DeskObjectLink } from './types'
import { AboutTextValue } from './ui/AboutTextValue'
import { AboutTextView } from './ui/AboutTextView'
import { DeskNav } from './ui/DeskNav'
import { DiaryReader } from './ui/DiaryReader'
import './styles/about.css'

// three.js 장면은 별도 청크로 — About 이 화면에 들어올 때 불러옵니다
const DeskCanvas = lazy(() => import('./scene/DeskCanvas').then((m) => ({ default: m.DeskCanvas })))

type DeskObject = DeskObjectLink['object']
type Phase = 'closed' | 'opening' | 'open' | 'closing'

export interface AboutSectionProps {
  /** 콘텐츠 (기본값: data/aboutContent.ts) */
  content?: AboutContent
  /** 섹션 id — 메인 내비게이션 앵커로 사용 */
  id?: string
  className?: string
  /** 책상 장면의 첫 프레임들이 그려진 뒤 한 번 호출 (3D 를 쓸 수 없으면 바로) — 화면 전환을 걷는 시점 */
  onReady?: () => void
}

/**
 * About — Behind the Magic / The Designer's Desk.
 *
 * 3D 작업 책상 위 물건이 인터페이스로 동작합니다.
 * - 다이어리: 클릭하면 카메라가 다가가고 표지와 낱장이 넘어가며 자기소개가 펼쳐짐
 * - 메모 · 스와치 · 펜꽂이: 다이어리를 해당 페이지로 바로 펼침
 * - 같은 동작을 하는 DOM 버튼(책상 위 물건 · 이전/다음/닫기)과 '자기소개 바로 보기' 텍스트 제공
 */
export function AboutSection({ content = defaultContent, id = 'about', className = '', onReady }: AboutSectionProps) {
  const reducedMotion = usePrefersReducedMotion()
  const quality = useQuality()
  const narrow = useMediaQuery('(max-width: 760px), (max-aspect-ratio: 4/5)')
  const [webgl] = useState(hasWebGL)

  const rootRef = useRef<HTMLElement>(null)
  const openBtnRef = useRef<HTMLButtonElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)

  const [open, setOpen] = useState(false)
  const [spread, setSpread] = useState(0)
  const [phase, setPhase] = useState<Phase>('closed')
  const [highlighted, setHighlighted] = useState<DeskObject | null>(null)
  const [textOpen, setTextOpen] = useState(!webgl)
  const [anim] = useState(createDiaryAnim)
  const returnFocus = useRef(false)

  const pageCount = content.pages.length
  const titleId = `${id}-title`
  const textId = `${id}-text`

  const openAt = useCallback(
    (object: DeskObject) => {
      const link = content.deskObjects.find((d) => d.object === object)
      const index = Math.max(0, content.pages.findIndex((p) => p.id === link?.page))
      setHighlighted(null)
      setSpread(index)
      setOpen(true)
      setPhase('opening')
    },
    [content],
  )

  const close = useCallback(() => {
    returnFocus.current = true
    setOpen(false)
    setPhase('closing')
    // 닫히는 동안 포커스가 사라지지 않도록 섹션에 잠시 두고, 다 닫히면 열기 버튼으로
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  const turn = useCallback(
    (dir: 1 | -1) => setSpread((s) => Math.min(pageCount - 1, Math.max(0, s + dir))),
    [pageCount],
  )

  const showText = useCallback(
    (pageId?: string) => {
      setTextOpen(true)
      requestAnimationFrame(() => {
        const target = (pageId && document.getElementById(`${textId}-${pageId}`)) || textRef.current
        target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
        target?.focus({ preventScroll: true })
      })
    },
    [reducedMotion, textId],
  )

  // 펼친 상태에서 키보드 조작
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        turn(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        turn(-1)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, turn, close])

  const onClosed = useCallback(() => setPhase('closed'), [])

  // 완전히 닫혀 열기 버튼이 다시 보이게 된 뒤 포커스를 돌려줍니다
  useEffect(() => {
    if (phase === 'closed' && returnFocus.current) {
      returnFocus.current = false
      openBtnRef.current?.focus({ preventScroll: true })
    }
  }, [phase])
  const onOpened = useCallback(() => setPhase('open'), [])

  const busy = phase !== 'closed'

  // 3D 없이 텍스트로 보여 주는 환경에서는 바로 준비 완료
  useEffect(() => {
    if (!webgl) onReady?.()
  }, [webgl, onReady])

  return (
    <section
      ref={rootRef}
      id={id}
      tabIndex={-1}
      className={`ab-root ${busy ? 'is-open' : ''} ${narrow ? 'is-narrow' : ''} ${
        highlighted && !busy ? 'is-pointing' : ''
      } ${className}`.trim()}
      data-phase={phase}
      aria-labelledby={titleId}
    >
      <div className="ab-stage">
        {webgl ? (
          <Suspense fallback={<div className="ab-stage__loading" aria-hidden="true" />}>
            <DeskCanvas
              content={content}
              quality={quality}
              open={open}
              spread={spread}
              reducedMotion={reducedMotion}
              active={inView}
              highlighted={highlighted}
              readingInset={narrow ? 0 : 0.14}
              anim={anim}
              onHighlight={setHighlighted}
              onSelect={openAt}
              onTurn={turn}
              onOpened={onOpened}
              onClosed={onClosed}
              onReady={onReady}
            />
          </Suspense>
        ) : (
          <div className="ab-stage__fallback" aria-hidden="true" />
        )}

        {/* 다이어리를 열지 않아도 About 섹션임을 알 수 있는 소개 */}
        <div className="ab-intro" aria-hidden={busy}>
          <p className="ab-eyebrow">
            <span>About</span>
            <span className="ab-eyebrow__rule" aria-hidden="true" />
            <span>Behind the Magic</span>
          </p>
          <h2 id={titleId} className="ab-title">
            The Designer’s <em>Desk</em>
          </h2>
          <p className="ab-lead">
            <AboutTextValue value={content.lead} />
          </p>
          <div className="ab-actions">
            {webgl && (
              <button
                ref={openBtnRef}
                type="button"
                className="ab-button ab-button--primary"
                onClick={() => openAt('diary')}
                tabIndex={busy ? -1 : 0}
              >
                Open the Diary
                <span className="ab-button__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            )}
            <button
              type="button"
              className="ab-button ab-button--ghost"
              onClick={() => showText()}
              aria-controls={textId}
              aria-expanded={textOpen}
              tabIndex={busy ? -1 : 0}
            >
              자기소개 바로 보기
            </button>
          </div>
        </div>

        {webgl && !busy && (
          <DeskNav
            objects={content.deskObjects}
            highlighted={highlighted}
            disabled={busy}
            onHighlight={setHighlighted}
            onSelect={openAt}
          />
        )}

        {webgl && open && !narrow && (
          <DiaryReader
            pages={content.pages}
            spread={spread}
            sheet={false}
            focusOnMount
            onPrev={() => turn(-1)}
            onNext={() => turn(1)}
            onClose={close}
            onShowText={() => showText(content.pages[spread].id)}
          />
        )}
      </div>

      {webgl && open && narrow && (
        <DiaryReader
          pages={content.pages}
          spread={spread}
          sheet
          focusOnMount
          onPrev={() => turn(-1)}
          onNext={() => turn(1)}
          onClose={close}
          onShowText={() => showText(content.pages[spread].id)}
        />
      )}

      <div hidden={!textOpen}>
        <AboutTextView ref={textRef} content={content} id={textId} />
      </div>
    </section>
  )
}
