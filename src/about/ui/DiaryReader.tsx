import { useEffect, useRef } from 'react'
import type { AboutPage } from '../types'
import { PageContent } from './PageContent'

interface DiaryReaderProps {
  pages: AboutPage[]
  spread: number
  /** 좁은 화면 — 3D 아래에 읽기 시트를 표시 */
  sheet: boolean
  /** 다이어리가 막 열렸을 때 포커스를 옮길지 */
  focusOnMount: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  onShowText: () => void
}

/**
 * 펼친 다이어리의 조작부.
 * - 이전 / 다음 / 닫기 버튼과 현재 페이지 표시 (키보드: ← → Esc)
 * - 넓은 화면: 3D 페이지가 내용을 보여주고, 같은 내용을 스크린 리더용으로 제공
 * - 좁은 화면: 3D 아래 읽기 시트에 HTML 내용을 크게 표시
 */
export function DiaryReader({
  pages,
  spread,
  sheet,
  focusOnMount,
  onPrev,
  onNext,
  onClose,
  onShowText,
}: DiaryReaderProps) {
  const page = pages[spread]
  const headingId = `ab-reader-${page.id}`
  const regionRef = useRef<HTMLDivElement>(null)
  const first = spread === 0
  const last = spread === pages.length - 1

  // 열리면 읽기 영역으로, 페이지가 바뀌면 새 제목으로 포커스 이동
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      if (!focusOnMount) return
    }
    const h = document.getElementById(headingId)
    h?.focus({ preventScroll: true })
  }, [headingId, focusOnMount])

  return (
    <div ref={regionRef} className={`ab-reader ${sheet ? 'ab-reader--sheet' : ''}`} role="region" aria-label="펼친 다이어리">
      <div className={sheet ? 'ab-reader__sheet' : 'ab-visually-hidden'} aria-live="polite">
        <PageContent page={page} headingId={headingId} focusableHeading />
      </div>

      <div className="ab-reader__controls">
        <button type="button" className="ab-ctrl" onClick={onPrev} disabled={first} aria-label="이전 페이지">
          <span aria-hidden="true">←</span>
          <span className="ab-ctrl__text">Prev</span>
        </button>
        <p className="ab-reader__status">
          <span className="ab-reader__count">
            {page.number} <span aria-hidden="true">/</span>
            <span className="ab-visually-hidden">전체</span> {String(pages.length).padStart(2, '0')}
          </span>
          <span className="ab-reader__title">{page.title}</span>
        </p>
        <button type="button" className="ab-ctrl" onClick={onNext} disabled={last} aria-label="다음 페이지">
          <span className="ab-ctrl__text">Next</span>
          <span aria-hidden="true">→</span>
        </button>
        <span className="ab-reader__divider" aria-hidden="true" />
        <button type="button" className="ab-ctrl ab-ctrl--close" onClick={onClose}>
          <span aria-hidden="true">✕</span>
          <span className="ab-ctrl__text">Close</span>
          <span className="ab-visually-hidden">다이어리 닫기</span>
        </button>
      </div>
      {!sheet && (
        <p className="ab-reader__hint">
          <kbd>←</kbd> <kbd>→</kbd> 페이지 넘기기 · <kbd>Esc</kbd> 닫기 ·{' '}
          <button type="button" className="ab-linkbtn" onClick={onShowText}>
            텍스트로 보기
          </button>
        </p>
      )}
    </div>
  )
}
