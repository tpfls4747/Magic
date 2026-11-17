import type { CSSProperties, ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'

interface RevealProps {
  children: ReactNode
  className?: string
  /** 등장 지연 (ms) — 같은 줄의 카드를 순서대로 보여줄 때 */
  delay?: number
}

/** 화면에 들어올 때 부드럽게 떠오르는 래퍼. 애니메이션 감소 설정에서는 즉시 표시됩니다. */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>()
  const style = delay ? ({ '--cs-reveal-delay': `${delay}ms` } as CSSProperties) : undefined
  return (
    <div
      ref={ref}
      className={`cs-reveal ${revealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )
}
