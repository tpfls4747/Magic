import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { Project } from '@/data/projects'
import { goToSpace } from '@/lib/space'
import { GALLERY_STOP, goToStop, TOUR_PROJECTS, useActiveStop } from '@/lib/tour'
import './WorksNav.css'

const number = (p: Project) => String(p.index).padStart(2, '0')

/**
 * 상단 Works 내비게이션.
 * - 넓은 화면: Gallery · 01 Seat Swap · 02 Sign-up Redesign 을 한 줄로 바로 표시
 * - 좁은 화면: 'Works' 버튼으로 여닫는 메뉴 (작은 3D 터치 영역 대신 쓰는 바로가기)
 * 키보드: Tab 으로 진입, ←/→/↑/↓ 로 항목 이동, Home/End, Esc 로 메뉴 닫기
 */
export function WorksNav() {
  const projects = TOUR_PROJECTS
  const active = useActiveStop()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  const items = [
    { stop: GALLERY_STOP, label: 'Gallery', no: '' },
    ...projects.map((p, i) => ({ stop: i + 1, label: p.title, no: number(p) })),
  ]

  // 화면에 보이는 항목만 (숨겨진 구분선 등은 건너뜀)
  const buttons = () =>
    Array.from(listRef.current?.querySelectorAll('button') ?? []).filter((b) => b.offsetParent !== null)

  // 메뉴 밖을 누르면 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const openMenu = () => {
    setOpen(true)
    // 열면 현재 위치(없으면 첫 항목)로 포커스
    requestAnimationFrame(() => {
      const list = buttons()
      ;(list.find((b) => b.getAttribute('aria-current')) ?? list[0])?.focus()
    })
  }

  const select = (stop: number) => {
    setOpen(false)
    goToStop(stop, { focus: true })
  }

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const list = buttons()
    const i = list.indexOf(document.activeElement as HTMLButtonElement)
    const move = (to: number) => {
      e.preventDefault()
      list[(to + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') move(i + 1)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') move(i - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(list.length - 1)
    else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
      toggleRef.current?.focus()
    }
  }

  return (
    <nav ref={navRef} className="works-nav" aria-label="Works" data-tour-nav>
      <button
        ref={toggleRef}
        type="button"
        className="works-nav__toggle"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        Works
        <span className="works-nav__chevron" aria-hidden="true" />
      </button>
      <ul id={menuId} ref={listRef} className="works-nav__list" data-open={open} onKeyDown={onListKey}>
        {items.map((item) => (
          <li key={item.stop}>
            <button
              type="button"
              className="works-nav__item"
              aria-current={active === item.stop ? 'location' : undefined}
              onClick={() => select(item.stop)}
            >
              {item.no && <span className="works-nav__no">{item.no}</span>}
              {item.label}
            </button>
          </li>
        ))}
        {/* 작품과 구분되는 소개 공간 — The Designer's Desk */}
        <li className="works-nav__about">
          <button
            type="button"
            className="works-nav__item works-nav__item--about"
            onClick={() => {
              setOpen(false)
              goToSpace('desk')
            }}
          >
            <span className="works-nav__star" aria-hidden="true">
              ✦
            </span>
            About
            <span className="works-nav__sub">The Designer’s Desk</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

/**
 * 첫 화면(전시관 전체)의 작품 바로가기 — 좁은 화면에서만 표시.
 * 모바일에서 작은 3D 오브젝트를 정확히 탭하지 않아도 작품으로 갈 수 있게 합니다.
 */
export function WorksShortcuts() {
  const projects = TOUR_PROJECTS
  return (
    <div className="works-shortcuts" role="group" aria-label="작품 바로가기">
      {projects.map((p, i) => (
        <button
          key={p.id}
          type="button"
          className="works-shortcuts__item"
          onClick={() => goToStop(i + 1, { focus: true })}
        >
          <span className="works-nav__no">{number(p)}</span>
          {p.title}
        </button>
      ))}
    </div>
  )
}
