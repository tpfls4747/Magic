import type { DeskObjectLink } from '../types'

type DeskObject = DeskObjectLink['object']

interface DeskNavProps {
  objects: DeskObjectLink[]
  highlighted: DeskObject | null
  disabled: boolean
  onHighlight: (o: DeskObject | null) => void
  onSelect: (o: DeskObject) => void
}

/** 책상 위 소품 아이콘 (선 그림) */
function ObjectIcon({ object }: { object: DeskObject }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (object) {
    case 'diary':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="5" y="3.5" width="14" height="17" rx="1.6" {...common} />
          <path d="M8 3.5v17M12 10.2a1.4 1.4 0 1 1 0 .1M11.4 11.4l-.5 2h2.2l-.5-2" {...common} />
        </svg>
      )
    case 'memo':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M5 5h14v10l-4 4H5z M15 19v-4h4" {...common} />
          <path d="M8 9h8M8 12h5" {...common} />
        </svg>
      )
    case 'swatches':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="9.5" y="3" width="5" height="15" rx="1" {...common} />
          <rect x="9.5" y="3" width="5" height="15" rx="1" transform="rotate(-28 12 18)" {...common} />
          <rect x="9.5" y="3" width="5" height="15" rx="1" transform="rotate(28 12 18)" {...common} />
          <circle cx="12" cy="17" r="1" {...common} />
        </svg>
      )
    case 'pencil-cup':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M7 11h10l-1 9H8z" {...common} />
          <path d="M10 11 8.5 3.5M13 11l1.5-7.5M12 11V5" {...common} />
        </svg>
      )
  }
}

/**
 * 책상 위 물건 바로가기.
 * 3D 소품을 정확히 겨누지 않아도(키보드 · 작은 터치 화면) 같은 동작을 할 수 있는 버튼 목록입니다.
 * 버튼에 포커스하거나 마우스를 올리면 3D 장면의 해당 소품도 함께 강조됩니다.
 */
export function DeskNav({ objects, highlighted, disabled, onHighlight, onSelect }: DeskNavProps) {
  return (
    <nav className="ab-desknav" aria-label="책상 위 물건">
      <p className="ab-desknav__title" aria-hidden="true">
        On the desk
      </p>
      <ul className="ab-desknav__list">
        {objects.map((o) => (
          <li key={o.object}>
            <button
              type="button"
              className={`ab-chip ${highlighted === o.object ? 'is-active' : ''} ${o.object === 'diary' ? 'ab-chip--diary' : ''}`}
              disabled={disabled}
              onPointerEnter={() => onHighlight(o.object)}
              onPointerLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(o.object)}
              onBlur={() => onHighlight(null)}
              onClick={() => onSelect(o.object)}
            >
              <ObjectIcon object={o.object} />
              <span className="ab-chip__label">{o.label}</span>
              <span className="ab-chip__hint">{o.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
