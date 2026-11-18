import { AboutSection } from '@/about'
import { DESK_HASH } from '@/lib/space'
import './DesignersDesk.css'

interface DesignersDeskProps {
  onReady: () => void
  onBack: () => void
}

/**
 * The Designer's Desk 공간 — 기존 About 모듈(src/about)을 그대로 띄우고,
 * 같은 사이트임을 알 수 있는 상단 바와 'Back to Gallery' 만 덧붙입니다.
 * (책 닫기 = 책상으로 / Back to Gallery = 전시관으로 — 두 동작을 분리)
 */
export default function DesignersDesk({ onReady, onBack }: DesignersDeskProps) {
  return (
    <div className="desk-space">
      <header className="desk-space__bar">
        <span className="desk-space__mark">Unlock My World</span>
        <p className="desk-space__where" aria-hidden="true">
          <span className="desk-space__where-dot" />
          The Designer’s Desk
        </p>
        <button type="button" className="desk-space__back" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to Gallery
        </button>
      </header>
      <AboutSection id={DESK_HASH.slice(1)} className="desk-space__about" onReady={onReady} />
    </div>
  )
}
