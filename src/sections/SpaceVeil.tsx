import type { Space } from '@/lib/space'
import { SPACE_LABEL } from '@/lib/space'
import './SpaceVeil.css'

export type VeilState = 'hidden' | 'in' | 'covered' | 'out'

/**
 * 공간 전환 막 — 아이보리·라벤더 빛이 화면을 덮는 동안 공간을 교체하고, 새 공간이 그려지면 걷힙니다.
 * 가운데에 도착할 공간 이름을 보여 줘 지금 어디로 가는지 알 수 있게 합니다.
 */
export function SpaceVeil({ state, target }: { state: VeilState; target: Space }) {
  if (state === 'hidden') return null
  return (
    <div className={`space-veil is-${state}`} aria-hidden="true">
      <p className="space-veil__label">
        <span className="space-veil__star">✦</span>
        {SPACE_LABEL[target]}
      </p>
    </div>
  )
}
