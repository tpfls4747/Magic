import { useRef, type KeyboardEvent } from 'react'
import type { ProcessStage } from '../types'

interface StageNavProps {
  stages: ProcessStage[]
  selected: number | null
  highlighted: number | null
  compact?: boolean
  onHighlight: (i: number | null) => void
  onSelect: (i: number) => void
  onOverview: () => void
}

/**
 * 다섯 단계 바로가기.
 * 순서와 상관없이 원하는 단계로 바로 이동하며, 현재 단계는 aria-current 와 금색 표시로 나타냅니다.
 * ← → / Home / End 로 버튼 사이를 이동할 수 있고, 포커스하면 3D 보드의 해당 카드도 강조됩니다.
 */
export function StageNav({ stages, selected, highlighted, compact, onHighlight, onSelect, onOverview }: StageNavProps) {
  const listRef = useRef<HTMLOListElement>(null)

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % buttons.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + buttons.length) % buttons.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = buttons.length - 1
    if (next >= 0) {
      e.preventDefault()
      e.stopPropagation()
      buttons[next].focus()
    }
  }

  return (
    <nav className={`pr-nav ${compact ? 'pr-nav--compact' : ''}`} aria-label="프로세스 단계 바로가기">
      <ol ref={listRef} className="pr-nav__list" onKeyDown={onKeyDown}>
        {stages.map((s, i) => {
          const current = selected === i
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`pr-step ${current ? 'is-current' : ''} ${highlighted === i ? 'is-hot' : ''}`}
                aria-current={current ? 'step' : undefined}
                onClick={() => onSelect(i)}
                onPointerEnter={() => onHighlight(i)}
                onPointerLeave={() => onHighlight(null)}
                onFocus={() => onHighlight(i)}
                onBlur={() => onHighlight(null)}
              >
                <span className="pr-step__number">{s.number}</span>
                <span className="pr-step__title">{s.title}</span>
                <span className="pr-step__label">{s.label}</span>
              </button>
              {i < stages.length - 1 && <span className="pr-nav__link" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
      {selected !== null && !compact && (
        <button type="button" className="pr-overview" onClick={onOverview}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 9h4v6H7zM13 9h4M13 12h4M13 15h3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          전체 보드
        </button>
      )}
    </nav>
  )
}
