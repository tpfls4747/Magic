import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ProcessStage } from '../types'
import { drawStageCard } from './art'
import { face, slab } from './geometry'
import { CARD } from './layout'
import { paper } from './materials'

const tmpV = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()
const focusPos = new THREE.Vector3()
const focusQ = new THREE.Quaternion()
const boardPos = new THREE.Vector3()
const boardQ = new THREE.Quaternion()
const pullPos = new THREE.Vector3()

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 카드 머티리얼 — 금박 옆면(빛 세기 변화) + 인쇄면 */
class CardMaterials {
  edge = new THREE.MeshPhysicalMaterial({
    color: '#d9bb83',
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0.3,
    emissive: new THREE.Color('#ffd9a0'),
    emissiveIntensity: 0,
    envMapIntensity: 1.4,
  })
  front: THREE.MeshStandardMaterial

  constructor(stage: ProcessStage, quality: 'high' | 'low') {
    const map = drawStageCard(stage, quality === 'high' ? 1024 : 640)
    // emissiveMap 으로 종이를 살짝 밝혀 조명이 약한 곳에서도 글자 대비 유지
    this.front = new THREE.MeshStandardMaterial({
      color: '#f4eee6',
      map,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: map,
      emissiveIntensity: 0.3,
      roughness: 0.86,
      envMapIntensity: 0.3,
    })
  }

  /** glow: 금박 빛 세기, light: 인쇄면 밝기 (다른 단계가 선택되면 살짝 어둡게) */
  update(glow: number, light: number) {
    this.edge.emissiveIntensity = glow
    this.front.color.setRGB(0.957 * light, 0.933 * light, 0.902 * light, THREE.SRGBColorSpace)
  }

  dispose() {
    this.edge.dispose()
    this.front.map?.dispose()
    this.front.dispose()
  }
}

/** 카드가 보드에서 떨어져 나오는 시간 (초) */
const DETACH_DURATION = 1.15

export interface FocusFrame {
  /** 화면 폭 대비 카드 중심의 가로 위치 (-0.5 ~ 0.5) */
  offsetX: number
  /** 화면 높이 대비 카드 높이 */
  fill: number
}

interface StageCardProps {
  stage: ProcessStage
  index: number
  /** 보드 위 카드 중심 (월드) */
  x: number
  y: number
  tilt: number
  selected: boolean
  hovered: boolean
  dimmed: boolean
  reducedMotion: boolean
  quality: 'high' | 'low'
  focus: FocusFrame
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}

/**
 * 단계 카드 — 두께 있는 보드지 + 금박 옆면.
 * - 호버: 보드에서 앞으로 떠오르고(그림자가 멀어짐) 금박 옆면이 은은하게 빛남
 * - 선택: 보드에서 앞으로 당겨지듯 분리 → 살짝 몸을 틀며 날아와 → 카메라 앞에서 커지며 정면을 향함
 *   (카메라 앞 위치는 매 프레임 현재 카메라 기준으로 계산 — 카메라가 움직여도 화면에 고정)
 */
export function StageCard(props: StageCardProps) {
  const { stage, index, x, y, tilt, selected, hovered, dimmed, reducedMotion, quality, focus } = props
  const group = useRef<THREE.Group>(null)
  const detach = useRef(0)
  const hover = useRef(0)
  const dim = useRef(0)

  const geoms = useMemo(
    () => ({
      body: slab(CARD.width, CARD.height, CARD.thickness, CARD.radius, 0.003),
      front: face(CARD.width - 0.004, CARD.height - 0.004, CARD.radius - 0.002),
    }),
    [],
  )
  useEffect(
    () => () => {
      geoms.body.dispose()
      geoms.front.dispose()
    },
    [geoms],
  )

  const mats = useMemo(() => new CardMaterials(stage, quality), [stage, quality])
  useEffect(() => () => mats.dispose(), [mats])
  const bodyMats = useMemo(() => [paper(), mats.edge], [mats])

  useFrame((state, rawDt) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(rawDt, 1 / 20)
    const camera = state.camera as THREE.PerspectiveCamera

    // 진행도
    const want = selected ? 1 : 0
    if (reducedMotion) detach.current = want
    else detach.current = THREE.MathUtils.clamp(detach.current + Math.sign(want - detach.current) * (dt / DETACH_DURATION), 0, 1)
    const wantHover = hovered && !selected ? 1 : 0
    hover.current = reducedMotion ? wantHover : THREE.MathUtils.damp(hover.current, wantHover, 10, dt)
    dim.current = reducedMotion ? (dimmed ? 1 : 0) : THREE.MathUtils.damp(dim.current, dimmed ? 1 : 0, 5, dt)

    // 보드 위 자세 (호버 시 앞으로 떠오름)
    boardPos.set(x, y, 0.003 + hover.current * 0.06)
    boardQ.setFromEuler(tmpE.set(-hover.current * 0.04, 0, tilt * (1 - hover.current * 0.5)))

    const e = easeInOut(detach.current)
    if (e <= 0.0001) {
      g.position.copy(boardPos)
      g.quaternion.copy(boardQ)
      g.scale.setScalar(1 + hover.current * 0.03)
    } else {
      // 카메라 앞 자세
      const D = 1.25
      const viewH = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
      const viewW = viewH * camera.aspect
      const scale = (focus.fill * viewH) / CARD.height
      const t = state.clock.elapsedTime
      const sway = reducedMotion ? 0 : 1
      focusPos.set(focus.offsetX * viewW, Math.sin(t * 1.1) * 0.006 * sway, -D)
      camera.localToWorld(focusPos)
      // 카드 중심이 아니라 뒷면 원점 기준이므로 그대로 사용 (두께는 미미)
      focusQ.copy(camera.quaternion).multiply(tmpQ.setFromEuler(tmpE.set(0, -0.08 + Math.sin(t * 0.7) * 0.015 * sway, 0)))

      // 보드에서 앞으로 당겨 나온 지점을 거쳐 날아오는 곡선
      pullPos.copy(boardPos).add(tmpV.set(0, 0, 0.5))
      const u = e
      g.position
        .copy(boardPos)
        .multiplyScalar((1 - u) * (1 - u))
        .addScaledVector(pullPos, 2 * u * (1 - u))
        .addScaledVector(focusPos, u * u)

      // 회전: 처음엔 위쪽이 들리며 떨어지고(peel), 날아오며 몸을 틀어 정면으로
      g.quaternion.slerpQuaternions(boardQ, focusQ, smoothstep(0.1, 1, u))
      const arc = Math.sin(Math.PI * u)
      g.quaternion.multiply(tmpQ.setFromEuler(tmpE.set(-arc * 0.32, arc * 0.35, 0)))
      g.scale.setScalar(THREE.MathUtils.lerp(1, scale, smoothstep(0.2, 1, u)))
    }

    // 금박 빛: 호버 시 은은하게, 선택 시 약하게 유지
    mats.update(hover.current * 0.55 + e * 0.18, 1 - dim.current * 0.12)
  })

  const over = (ev: ThreeEvent<PointerEvent>) => {
    ev.stopPropagation()
    props.onHover(index)
  }

  return (
    <group
      ref={group}
      onPointerOver={over}
      onPointerOut={() => props.onHover(null)}
      onClick={(ev) => {
        ev.stopPropagation()
        props.onSelect(index)
      }}
    >
      <mesh geometry={geoms.body} material={bodyMats} castShadow receiveShadow />
      <mesh geometry={geoms.front} position={[0, 0, CARD.thickness + 0.0004]} material={mats.front} receiveShadow />
    </group>
  )
}
