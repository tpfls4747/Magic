import { goToSpace, SPACE_LABEL, SPACE_NAV, type Space } from '@/lib/space'
import './SpaceBar.css'

/**
 * 전시관 밖 공간(Designer's Desk · Process Board …)의 공통 상단 바.
 * 사이트 이름 · 지금 있는 공간 · 다른 공간으로 가는 메뉴 · Back to Gallery.
 */
export function SpaceBar({ current, onBack }: { current: Exclude<Space, 'gallery'>; onBack: () => void }) {
  return (
    <header className="space-bar">
      <span className="space-bar__mark">Unlock My World</span>
      <p className="space-bar__where" aria-hidden="true">
        <span className="space-bar__dot" />
        {SPACE_LABEL[current]}
      </p>
      <nav className="space-bar__nav" aria-label="Site">
        <ul>
          {SPACE_NAV.map((item) => (
            <li key={item.space}>
              <button
                type="button"
                className="space-bar__link"
                aria-current={item.space === current ? 'page' : undefined}
                onClick={() => goToSpace(item.space)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button type="button" className="space-bar__back" onClick={onBack} aria-label="Back to Gallery">
        <span aria-hidden="true">←</span>
        <span>
          <span className="space-bar__back-long">Back to </span>Gallery
        </span>
      </button>
    </header>
  )
}
