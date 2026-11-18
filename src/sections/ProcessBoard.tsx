import { ProcessSection } from '@/process'
import { SPACE_HASH } from '@/lib/space'
import { SpaceBar } from './SpaceBar'
import './ProcessBoard.css'

interface ProcessBoardProps {
  onReady: () => void
  onBack: () => void
}

/**
 * The Process Board 공간 — 기존 Process 모듈(src/process)을 그대로 띄우고 공통 상단 바만 덧붙입니다.
 * (전체 보드 = 카드 확대 해제 / Back to Gallery = 전시관으로 — 두 동작을 분리)
 */
export default function ProcessBoard({ onReady, onBack }: ProcessBoardProps) {
  return (
    <div className="space-page process-space">
      <SpaceBar current="process" onBack={onBack} />
      <ProcessSection id={SPACE_HASH.process.slice(1)} className="process-space__board" onReady={onReady} />
    </div>
  )
}
