import { AboutSection } from '@/about'
import { SPACE_HASH } from '@/lib/space'
import { SpaceBar } from './SpaceBar'
import './DesignersDesk.css'

interface DesignersDeskProps {
  onReady: () => void
  onBack: () => void
}

/**
 * The Designer's Desk 공간 — 기존 About 모듈(src/about)을 그대로 띄우고,
 * 같은 사이트임을 알 수 있는 공통 상단 바(SpaceBar)만 덧붙입니다.
 * (책 닫기 = 책상으로 / Back to Gallery = 전시관으로 — 두 동작을 분리)
 */
export default function DesignersDesk({ onReady, onBack }: DesignersDeskProps) {
  return (
    <div className="space-page desk-space">
      <SpaceBar current="desk" onBack={onBack} />
      <AboutSection id={SPACE_HASH.desk.slice(1)} className="desk-space__about" onReady={onReady} />
    </div>
  )
}
