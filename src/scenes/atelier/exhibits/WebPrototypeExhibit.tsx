import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Browser } from './Browser'
import { SCREEN } from './browserGeometry'
import { WEB_PROTOTYPE } from './layout'
import { roundedRectGeometry } from './shapes'
import { createCardShadowTexture } from './uiCanvas'
import { useExhibitInteraction } from './useExhibitInteraction'
import {
  ADDRESS_TEXT,
  createWebPrototypePage,
  PAGE_PX,
  type PageLayer,
} from './webPrototypeScreen'

/**
 * 작품 3 — Web Prototype: A Living Interface
 * 뒤쪽 중앙 전시대 위에 떠 있는 3D 브라우저.
 * - 기본: 하나의 완성된 웹페이지. 천천히 떠 있고 마우스 쪽으로 아주 조금 기웁니다.
 * - hover: UI 레이어들이 서로 다른 깊이로 살짝 떠올라 깊이감이 생깁니다.
 * - 클릭 / 탭: 브라우저가 조금 돌아서며 레이어가 공간으로 크게 펼쳐집니다 (분해도).
 *   다시 누르면 모든 레이어가 화면 안으로 조립됩니다.
 */

/** 펼치기 / 조립에 걸리는 시간 (초) */
const OPEN_DURATION = 1.3
/** 레이어마다 시작을 조금씩 늦춰 차례로 펼쳐지게 (전체 진행 중 비율) */
const STAGGER = 0.28
/** 펼쳤을 때 브라우저가 돌아서는 각도 — 레이어의 깊이가 읽히도록 (약 23°) */
const OPEN_TURN = -0.4
const OPEN_TILT = -0.05
/** 화면 논리 픽셀 → m */
const PX = SCREEN.width / PAGE_PX.width
/** 떠오른 레이어 아래 그림자 최대 진하기 */
const SHADOW_STRENGTH = 0.34

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** 레이어의 화면 위 기본 위치 (화면 중심 원점, m) */
function basePosition(l: PageLayer): [number, number] {
  return [
    (l.x + l.w / 2 - PAGE_PX.width / 2) * PX,
    (PAGE_PX.height / 2 - (l.y + l.h / 2)) * PX,
  ]
}

/** 레이어 윤곽선 (펼쳤을 때 금색 테두리로 '구조'를 드러냄) */
function outlineGeometry(w: number, h: number) {
  const g = new THREE.BufferGeometry()
  g.setFromPoints([
    new THREE.Vector3(-w / 2, -h / 2, 0),
    new THREE.Vector3(w / 2, -h / 2, 0),
    new THREE.Vector3(w / 2, h / 2, 0),
    new THREE.Vector3(-w / 2, h / 2, 0),
  ])
  return g
}

const asMaterial = (o: THREE.Object3D) =>
  (o as THREE.Mesh).material as THREE.MeshBasicMaterial | THREE.LineBasicMaterial

export function WebPrototypeExhibit({
  animate,
  castShadow,
}: {
  animate: boolean
  castShadow: boolean
}) {
  const floatRef = useRef<THREE.Group>(null)
  const turnRef = useRef<THREE.Group>(null)
  const hover = useRef(0)
  const open = useRef(0)
  const tilt = useRef({ x: 0, y: 0 })
  const { hovered, toggled, handlers } = useExhibitInteraction('web-prototype', { toggle: true })

  const page = useMemo(() => createWebPrototypePage(), [])
  const shadowTexture = useMemo(() => createCardShadowTexture(), [])
  const geometry = useMemo(
    () => ({
      background: roundedRectGeometry(SCREEN.width, SCREEN.height, SCREEN.radius, 10),
      layers: page.layers.map((l) => new THREE.PlaneGeometry(l.w * PX, l.h * PX)),
      outlines: page.layers.map((l) => outlineGeometry(l.w * PX, l.h * PX)),
      shadows: page.layers.map((l) => new THREE.PlaneGeometry(l.w * PX * 1.08, l.h * PX * 1.3)),
    }),
    [page],
  )
  useEffect(
    () => () => {
      page.dispose()
      shadowTexture.dispose()
      geometry.background.dispose()
      for (const list of [geometry.layers, geometry.outlines, geometry.shadows]) {
        list.forEach((g) => g.dispose())
      }
    },
    [page, shadowTexture, geometry],
  )

  const layerRefs = useRef<(THREE.Mesh | null)[]>([])
  const outlineRefs = useRef<(THREE.LineLoop | null)[]>([])
  const shadowRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock, pointer }, delta) => {
    const dt = Math.min(delta, 0.1)

    // hover: 부드러운 감쇠 / 펼치기: 일정 속도의 진행값 + 레이어별 이징
    if (animate) {
      hover.current += ((hovered ? 1 : 0) - hover.current) * (1 - Math.exp(-dt * 6))
      const step = dt / OPEN_DURATION
      open.current += THREE.MathUtils.clamp((toggled ? 1 : 0) - open.current, -step, step)
    } else {
      // 애니메이션 감소: 이동 과정 없이 상태만 바뀜
      hover.current = hovered ? 1 : 0
      open.current = toggled ? 1 : 0
    }
    const h = easeOutCubic(hover.current)
    const o = open.current
    const n = page.layers.length

    page.layers.forEach((l, i) => {
      const mesh = layerRefs.current[i]
      if (!mesh) return
      // 아래쪽(footer)부터가 아니라 위에서부터 차례로 — 내비게이션이 먼저 떠오름
      const delay = (i / Math.max(n - 1, 1)) * STAGGER
      const oi = easeInOutCubic(clamp01((o - delay) / (1 - STAGGER)))
      const [bx, by] = basePosition(l)
      const lift = l.hoverDepth * h * (1 - oi) + l.openDepth * oi
      mesh.position.set(bx + l.spread[0] * oi, by + l.spread[1] * oi, 0.0008 + i * 0.0002 + lift)

      const outline = outlineRefs.current[i]
      if (outline) {
        outline.position.copy(mesh.position)
        asMaterial(outline).opacity = 0.75 * oi
        outline.visible = oi > 0.01
      }
      const shadow = shadowRefs.current[i]
      if (shadow) {
        // 그림자는 화면 위에 남고, 레이어가 높이 뜰수록 넓고 옅게 퍼집니다
        const k = clamp01(lift / 0.36)
        shadow.position.set(bx + l.spread[0] * oi * 0.5, by + l.spread[1] * oi * 0.5 - k * 0.012, 0.0005)
        shadow.scale.setScalar(1 + k * 0.18)
        asMaterial(shadow).opacity = SHADOW_STRENGTH * Math.min(1, lift / 0.04) * (1 - k * 0.45)
        shadow.visible = l.shadow && lift > 0.002
      }
    })

    // 브라우저: 느린 부유 + 마우스 쪽으로 아주 조금 기울기 + 펼칠 때 돌아서기
    const e = easeInOutCubic(o)
    const t = clock.elapsedTime
    if (floatRef.current) {
      floatRef.current.position.y = animate ? Math.sin(t * 0.55 + 2.1) * 0.02 : 0
      floatRef.current.rotation.z = animate ? Math.sin(t * 0.4 + 0.7) * 0.01 : 0
    }
    if (turnRef.current) {
      const follow = animate ? 1 - Math.exp(-dt * 2.5) : 1
      tilt.current.y += (pointer.x * 0.05 - tilt.current.y) * follow
      tilt.current.x += (-pointer.y * 0.03 - tilt.current.x) * follow
      const live = animate ? 1 : 0
      turnRef.current.rotation.set(
        OPEN_TILT * e + tilt.current.x * live,
        OPEN_TURN * e + tilt.current.y * live,
        0,
      )
    }
  })

  return (
    <group position={WEB_PROTOTYPE.center} rotation-y={WEB_PROTOTYPE.yaw}>
      <group ref={floatRef}>
        <group ref={turnRef}>
          <Browser address={ADDRESS_TEXT} castShadow={castShadow}>
            <mesh geometry={geometry.background} renderOrder={2}>
              <meshBasicMaterial map={page.background} toneMapped={false} />
            </mesh>
            {page.layers.map((l, i) => (
              // 그림자를 쓰지 않는 레이어도 순서를 맞추기 위해 메시는 두고 보이지 않게만 합니다
              <mesh
                key={`s-${l.name}`}
                ref={(m) => void (shadowRefs.current[i] = m)}
                geometry={geometry.shadows[i]}
                renderOrder={3}
                visible={false}
              >
                <meshBasicMaterial
                  map={shadowTexture}
                  transparent
                  opacity={0}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            ))}
            {page.layers.map((l, i) => {
              const [bx, by] = basePosition(l)
              return (
                <mesh
                  key={l.name}
                  ref={(m) => void (layerRefs.current[i] = m)}
                  geometry={geometry.layers[i]}
                  position={[bx, by, 0.0008 + i * 0.0002]}
                  renderOrder={5}
                >
                  <meshBasicMaterial map={l.texture} transparent depthWrite={false} toneMapped={false} />
                </mesh>
              )
            })}
            {page.layers.map((l, i) => (
              <lineLoop
                key={`o-${l.name}`}
                ref={(m) => void (outlineRefs.current[i] = m)}
                geometry={geometry.outlines[i]}
                renderOrder={6}
                visible={false}
              >
                <lineBasicMaterial color="#c9a86a" transparent opacity={0} depthWrite={false} />
              </lineLoop>
            ))}
          </Browser>
        </group>
      </group>

      {/* 마우스·터치 감지 영역 — 펼친 레이어까지 덮도록 넉넉하게, 화면에는 보이지 않음 */}
      <mesh {...handlers} position-z={0.18}>
        <boxGeometry args={[1.5, 1.05, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}
