import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { SECTION_META, sectionDomId } from '../sections'
import type { SectionId } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** 해시 링크 이동 — 부드럽게 스크롤한 뒤 섹션에 포커스를 옮겨 키보드 사용자도 위치를 잃지 않게 합니다 */
function scrollToSection(domId: string) {
  const el = document.getElementById(domId)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `#${domId}`)
  el.focus({ preventScroll: true })
}

interface TocProps {
  sections: readonly SectionId[]
  activeId: string | null
}

/**
 * 목차 내비게이션.
 * - 넓은 화면: 본문 왼쪽에 고정되는 세로 목차
 * - 좁은 화면: 상단 바 아래의 '현재 섹션' 버튼 → 펼침 목록
 * 현재 읽고 있는 섹션은 aria-current 와 금색 표시선으로 나타냅니다.
 */
export function TableOfContents({ sections, activeId }: TocProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const activeIndex = sections.findIndex((s) => sectionDomId(s) === activeId)
  const active = activeIndex >= 0 ? sections[activeIndex] : undefined

  // Esc 로 닫기, 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onDown = (e: Event) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const onLinkClick = (e: MouseEvent<HTMLAnchorElement>, id: SectionId) => {
    e.preventDefault()
    setOpen(false)
    scrollToSection(sectionDomId(id))
  }

  return (
    <nav ref={navRef} className={`cs-toc ${open ? 'is-open' : ''}`} aria-label="케이스 스터디 목차">
      <button
        ref={toggleRef}
        type="button"
        className="cs-toc__toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cs-toc__toggle-index">{active ? pad(activeIndex + 1) : '—'}</span>
        <span className="cs-toc__toggle-label">{active ? SECTION_META[active].title : 'Contents'}</span>
        <span className="cs-toc__toggle-chevron" aria-hidden="true" />
      </button>

      <p className="cs-toc__heading" aria-hidden="true">
        Contents
      </p>
      <ol id={listId} className="cs-toc__list">
        {sections.map((id, i) => {
          const isActive = active === id
          return (
            <li key={id}>
              <a
                href={`#${sectionDomId(id)}`}
                className={`cs-toc__link ${isActive ? 'is-active' : ''} ${
                  activeIndex > i ? 'is-read' : ''
                }`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => onLinkClick(e, id)}
              >
                <span className="cs-toc__index">{pad(i + 1)}</span>
                <span className="cs-toc__title">{SECTION_META[id].title}</span>
                <span className="cs-toc__label">{SECTION_META[id].label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
