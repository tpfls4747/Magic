import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { BoardLayout } from './layout'

const target = new THREE.Vector3()
const pos = new THREE.Vector3()
const dir = new THREE.Vector3()

function fitDistance(width: number, height: number, fovDeg: number, aspect: number) {
  const vHalf = THREE.MathUtils.degToRad(fovDeg) / 2
  const hHalf = Math.atan(Math.tan(vHalf) * aspect)
  return Math.max(width / 2 / Math.tan(hHalf), height / 2 / Math.tan(vHalf))
}

/**
 * 시네마틱 카메라.
 * - 보드 구도: 보드 전체를 살짝 위에서 바라봄 (화면 비율에 맞춰 거리 자동 조정)
 * - 단계 선택: 선택한 단계 쪽으로 조금 다가가며 시선을 옮김 → 다른 단계로 이동하면 공간을 따라 미끄러지듯 이동
 * 목표 구도를 향해 부드럽게 감쇠 이동하며, 동작 줄이기 설정에서는 즉시 전환합니다.
 */
export function CameraDirector({
  layout,
  selected,
  reducedMotion,
  insets,
}: {
  layout: BoardLayout
  selected: number | null
  reducedMotion: boolean
  /** 보드 구도에서 비워 둘 화면 가장자리 비율 (왼쪽 소개 글, 위 · 아래 메뉴) */
  insets: { left: number; top: number; bottom: number }
}) {
  const cur = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  const parallax = useRef(new THREE.Vector2())

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const camera = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / Math.max(1, state.size.height)
    const portrait = layout.orientation === 'portrait'
    camera.fov = portrait ? 38 : 30

    // 보드 구도
    const { left, top, bottom } = insets
    const fitW = (layout.width + (portrait ? 0.12 : 0.4)) / (1 - left)
    const fitH = (layout.height + (portrait ? 0.12 : 0.4)) / (1 - top - bottom)
    const boardDist = fitDistance(fitW, fitH, camera.fov, aspect)
    // 비워 둔 영역만큼 보드를 반대쪽으로 밀어 배치
    const viewH = 2 * boardDist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const viewW = viewH * aspect
    target.set((-viewW * left) / 2, layout.centerY + (viewH * (top - bottom)) / 2, 0)
    dir.set(0, portrait ? 0.08 : 0.16, 1).normalize()

    if (selected !== null) {
      // 선택한 단계 쪽으로 다가감
      const c = layout.cards[selected]
      target.lerp(new THREE.Vector3(c.x, layout.centerY + c.y, 0), portrait ? 0.45 : 0.32)
      dir.set(c.x * (portrait ? 0.1 : 0.06), 0.1, 1).normalize()
      pos.copy(target).addScaledVector(dir, boardDist * (portrait ? 0.62 : 0.78))
    } else {
      pos.copy(target).addScaledVector(dir, boardDist)
    }

    if (!reducedMotion && selected === null) {
      parallax.current.x = THREE.MathUtils.damp(parallax.current.x, state.pointer.x, 2.5, dt)
      parallax.current.y = THREE.MathUtils.damp(parallax.current.y, state.pointer.y, 2.5, dt)
      pos.x += parallax.current.x * 0.08
      pos.y += parallax.current.y * 0.05
    }

    if (!cur.current) cur.current = { pos: pos.clone(), target: target.clone() }
    const k = reducedMotion ? 1 : 1 - Math.exp(-2.8 * dt)
    cur.current.pos.lerp(pos, k)
    cur.current.target.lerp(target, k)
    camera.position.copy(cur.current.pos)
    camera.lookAt(cur.current.target)
    camera.updateProjectionMatrix()
  })

  return null
}
