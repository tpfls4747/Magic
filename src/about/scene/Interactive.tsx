import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'

interface InteractiveProps {
  children: ReactNode
  /** 마우스를 올렸거나 키보드로 해당 버튼에 포커스했을 때 */
  active: boolean
  /** 비활성 (다이어리가 펼쳐진 동안 등) */
  disabled?: boolean
  label: string
  /** 들림 높이 (m) */
  lift?: number
  /** 라벨 위치 (그룹 로컬) */
  labelAt?: [number, number, number]
  reducedMotion: boolean
  onHover: (hovered: boolean) => void
  onActivate: () => void
}

/**
 * 책상 위 소품을 인터페이스로 만드는 래퍼.
 * 호버(또는 키보드 포커스) 시 살짝 들리고 이름표가 나타나며, 클릭하면 연결된 동작을 실행합니다.
 */
export function Interactive({
  children,
  active,
  disabled,
  label,
  lift = 0.012,
  labelAt = [0, 0.12, 0],
  reducedMotion,
  onHover,
  onActivate,
}: InteractiveProps) {
  const group = useRef<THREE.Group>(null)
  const y = useRef(0)
  const on = active && !disabled

  useFrame((_, dt) => {
    const want = on ? lift : 0
    y.current = reducedMotion ? want : THREE.MathUtils.damp(y.current, want, 10, Math.min(dt, 0.05))
    if (group.current) group.current.position.y = y.current
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (disabled) return
    onHover(true)
  }
  const out = () => onHover(false)

  return (
    <group
      ref={group}
      onPointerOver={over}
      onPointerOut={out}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onActivate()
      }}
    >
      {children}
      {on && (
        <Html position={labelAt} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="ab-object-label">{label}</span>
        </Html>
      )}
    </group>
  )
}
