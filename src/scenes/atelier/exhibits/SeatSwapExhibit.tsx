import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { PEDESTALS } from '../constants'
import { PEDESTAL_TOP } from '../Pedestals'
import { Ticket } from './Ticket'
import type { TicketInfo } from './ticketArt'

/**
 * 작품 1 — Seat Swap: 공연 좌석 교환 UX
 * 왼쪽 전시대 위에 떠 있는 두 장의 티켓. 마우스를 올리면(모바일은 탭) 서로 자리를 바꿉니다.
 */

const TICKETS: [TicketInfo, TicketInfo] = [
  { row: 'C', seat: '12', gate: '3', serial: 'UMW-2412-C12', accent: 'gold' },
  { row: 'F', seat: '08', gate: '5', serial: 'UMW-2412-F08', accent: 'lavender' },
]

interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

const pose = (p: [number, number, number], r: [number, number, number]): Pose => ({
  position: new THREE.Vector3(...p),
  quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),
})

/** 두 자리 — 앞쪽 위(A)와 뒤쪽 아래(B). 서로 다른 각도로 겹쳐 입체적인 구성을 만듭니다. */
const POSE_A = pose([-0.15, 0.075, 0.06], [-0.1, 0.2, 0.11])
const POSE_B = pose([0.15, -0.065, -0.07], [0.08, -0.16, -0.1])

/** 교환에 걸리는 시간 (초) */
const SWAP_DURATION = 1.25
/** 모바일 탭 후 원래 자리로 돌아오기까지 (ms) */
const TOUCH_RETURN_DELAY = 3200

/** 전시대 상판 위 작품 중심 높이 */
const EXHIBIT_LIFT = 0.5
/** 원거리에서도 읽히도록 실제 티켓보다 약간 크게 */
const EXHIBIT_SCALE = 1.22

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 카메라 쪽을 향하도록 하는 y 회전 (기본 카메라 위치 기준) */
function yawTowardCamera(x: number, z: number) {
  return Math.atan2(0 - x, 7.2 - z)
}

const tmpPos = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()
const tmpSpin = new THREE.Quaternion()
const tmpSway = new THREE.Quaternion()
const tmpEuler = new THREE.Euler()
const AXIS_Y = new THREE.Vector3(0, 1, 0)

export function SeatSwapExhibit({
  animate,
  castShadow,
}: {
  animate: boolean
  castShadow: boolean
}) {
  const [px, , pz] = PEDESTALS[0].position
  const yaw = useMemo(() => yawTowardCamera(px, pz), [px, pz])

  const ticketA = useRef<THREE.Group>(null)
  const ticketB = useRef<THREE.Group>(null)
  const [swapped, setSwapped] = useState(false)
  /** 0 = 원래 자리, 1 = 교환된 자리 (선형 진행값, 화면에는 이징을 적용) */
  const progress = useRef(0)
  const touchTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(touchTimer.current), [])
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  // ── 인터랙션: 마우스는 hover, 터치는 탭(일정 시간 뒤 자동 복귀)
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType === 'touch') return
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    setSwapped(true)
  }
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType === 'touch') return
    document.body.style.cursor = ''
    setSwapped(false)
  }
  const onTap = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType !== 'touch') return
    e.stopPropagation()
    window.clearTimeout(touchTimer.current)
    const next = !swapped
    setSwapped(next)
    if (next) touchTimer.current = window.setTimeout(() => setSwapped(false), TOUCH_RETURN_DELAY)
  }

  useFrame(({ clock }, delta) => {
    const a = ticketA.current
    const b = ticketB.current
    if (!a || !b) return

    // 진행값을 목표 쪽으로 일정 속도로 이동 → 이징 곡선으로 변환
    const target = swapped ? 1 : 0
    if (animate) {
      const step = Math.min(delta, 0.1) / SWAP_DURATION
      progress.current += THREE.MathUtils.clamp(target - progress.current, -step, step)
    } else {
      // 애니메이션 감소 설정: 이동 과정 없이 자리만 바뀝니다.
      progress.current = target
    }
    const e = easeInOutCubic(progress.current)
    const arc = Math.sin(e * Math.PI) // 교환 중간에 가장 크게

    const t = clock.elapsedTime
    const place = (
      obj: THREE.Group,
      from: Pose,
      to: Pose,
      depthDir: 1 | -1,
      phase: number,
    ) => {
      // 위치: 두 자리 사이를 보간하면서, 한 장은 앞으로 한 장은 뒤로 비켜 지나갑니다.
      tmpPos.lerpVectors(from.position, to.position, e)
      tmpPos.z += depthDir * arc * 0.17
      tmpPos.y += arc * (depthDir > 0 ? 0.05 : -0.015)

      // 회전: 두 각도 사이를 구면 보간 + 지나가는 동안 살짝 몸을 트는 회전
      tmpQuat.slerpQuaternions(from.quaternion, to.quaternion, e)
      tmpSpin.setFromAxisAngle(AXIS_Y, depthDir * arc * 0.28)
      tmpQuat.premultiply(tmpSpin)

      // 기본 상태의 부유감 — 아주 느리고 작은 움직임
      if (animate) {
        tmpPos.y += Math.sin(t * 0.75 + phase) * 0.022
        tmpEuler.set(
          Math.sin(t * 0.52 + phase) * 0.035,
          Math.sin(t * 0.38 + phase * 1.7) * 0.05,
          Math.sin(t * 0.6 + phase * 0.6) * 0.03,
        )
        tmpSway.setFromEuler(tmpEuler)
        tmpQuat.multiply(tmpSway)
      }

      obj.position.copy(tmpPos)
      obj.quaternion.copy(tmpQuat)
    }

    place(a, POSE_A, POSE_B, 1, 0)
    place(b, POSE_B, POSE_A, -1, 2.3)
  })

  return (
    <group position={[px, PEDESTAL_TOP + EXHIBIT_LIFT, pz]} rotation-y={yaw} scale={EXHIBIT_SCALE}>
      <Ticket ref={ticketA} info={TICKETS[0]} castShadow={castShadow} />
      <Ticket ref={ticketB} info={TICKETS[1]} castShadow={castShadow} />

      {/* 마우스·터치 감지 영역 — 움직이는 티켓보다 넉넉하게, 화면에는 보이지 않음 */}
      <mesh onPointerOver={onOver} onPointerOut={onOut} onPointerDown={onTap}>
        <boxGeometry args={[1.05, 0.62, 0.55]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}
