import './HeroOverlay.css'
import { WorksNav, WorksShortcuts } from './WorksNav'

/**
 * 3D 장면 위에 얹히는 최소한의 에디토리얼 타이포그래피.
 * 장면을 가리지 않도록 화면 가장자리에만 배치합니다.
 */
export function HeroOverlay() {
  return (
    <div className="hero-overlay">
      <div className="hero-overlay__vignette" />

      <header className="hero-overlay__bar">
        <span className="hero-overlay__mark">Unlock My World</span>
        <WorksNav />
      </header>

      <div className="hero-overlay__title" data-tour="hero-title">
        <p className="hero-overlay__eyebrow">An Exhibition of Three Works</p>
        <h1 tabIndex={-1}>
          The Floating <em>Atelier</em>
        </h1>
        <WorksShortcuts />
      </div>

      <div className="hero-overlay__hint" data-tour="hint" aria-hidden="true">
        <span>Scroll to enter</span>
        <i />
      </div>
    </div>
  )
}
