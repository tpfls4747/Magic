import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Browser } from './Browser'
import { BROWSER_FACE_Z, SCREEN } from './browserGeometry'
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
 *
 * - 기본: 하나의 완성된 웹페이지. 천천히 떠 있고 마우스 쪽으로 아주 조금 기웁니다.
 * - hover: 브라우저가 살짝 앞으로 나오고, 포인터 아래의 레이어가 조금 더 떠오릅니다.
 *   (텍스트와 레이아웃은 거의 그대로)
 * - 클릭 / 탭 (Exploded View):
 *   ① 브라우저가 약간 돌아서고 → ② 레이어가 앞쪽 계층부터 짧은 시간차로 Z 축으로 분리 →
 *   ③ 각 레이어가 미세하게 부유하다가 → ④ 안정적으로 정지.
 *   다시 누르면 같은 곡선을 거꾸로 따라 정확히 조립됩니다.
 *
 * 모든 움직임은 레이어의 '기준 위치 + 진행값 하나로 계산한 오프셋' 으로 매 프레임 새로 구합니다.
 * 이전 프레임 값에 더하지 않으므로 반복해서 펼치고 닫아도 위치 오차가 쌓이지 않습니다.
 * 카메라와는 독립적이며, 이 작품은 카메라를 건드리지 않습니다.
 */

/** 펼치기 / 조립 전체 시간 (초) */
const OPEN_DURATION = 1.5

/** 진행값 안에서의 순서 (0~1) */
const TURN_END = 0.4 // ① 회전
const LAYER_START = 0.18 // ② 첫 레이어 분리 시작
const LAYER_SPREAD = 0.3 // 앞 계층 → 뒤 계층 시간차
const LAYER_DURATION = 0.45 // 레이어 하나가 분리되는 데 걸리는 비율

/**
 * 펼칠 때 돌아서는 각도 — 근접 카메라가 이미 오른쪽에서 약 13° 비스듬히 보고 있으므로
 * 이만큼만 더 돌아도 측면의 깊이 차이가 충분히 보입니다. 세로 화면은 회전을 더 줄입니다.
 */
const OPEN_TURN = { landscape: -0.2, portrait: -0.12 }
const OPEN_TILT = -0.035

/**
 * 레이어 깊이 계산 근거
 * 펼친 상태를 근접 카메라에서 볼 때, 깊이 d 인 레이어는 화면 평면에서 d·sin(θ) 만큼 옆으로 비켜 보입니다.
 * (θ = 카메라 시선과 브라우저 정면 사이 각도 = 근접 시점 각도 + 펼칠 때의 회전)
 * 가장 앞 계층의 비켜남이 화면 폭의 약 6% 를 넘지 않게 하면, 내비게이션이 브라우저 밖으로 크게
 * 벗어나지 않고 정면에서는 원래 페이지 구성이 그대로 읽힙니다. 계층 사이는 그 깊이를 고르게 나눕니다.
 */
const MAX_SIDE_SHIFT = SCREEN.width * 0.06
const VIEW_ANGLE = WEB_PROTOTYPE.viewYaw - WEB_PROTOTYPE.yaw
function maxDepthFor(turn: number) {
  return MAX_SIDE_SHIFT / Math.sin(VIEW_ANGLE - turn)
}
const DESKTOP_MAX_DEPTH = maxDepthFor(OPEN_TURN.landscape) // ≈ 0.18 m

/** hover 깊이 — 브라우저 전체가 앞으로 나오는 양, 계층별 아주 작은 분리, 포인터 아래 레이어의 추가 상승 */
const HOVER_BROWSER = 0.012
const HOVER_PER_TIER = 0.0018
const HOVER_TARGET = 0.016

/** 펼친 직후의 미세한 부유 — 진폭과 가라앉는 속도 */
const FLOAT_Z = 0.003
const FLOAT_Y = 0.0018
const SETTLE_RATE = 1.1

/** 화면 콘텐츠 밝기 — 톤매핑 없이 원색으로 그리는 화면이 갤러리보다 튀지 않도록 살짝 낮춤 */
const SCREEN_TINT = '#f0ece6'

/** 화면 논리 픽셀 → m */
const PX = SCREEN.width / PAGE_PX.width
const SHADOW_STRENGTH = 0.3

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** 레이어의 화면 위 기준 위치 (화면 중심 원점, m) — 펼쳐도 X·Y 는 그대로 유지 */
function basePosition(l: PageLayer): [number, number] {
  return [
    (l.x + l.w / 2 - PAGE_PX.width / 2) * PX,
    (PAGE_PX.height / 2 - (l.y + l.h / 2)) * PX,
  ]
}

/** 레이어 윤곽선 (펼쳤을 때 가는 금색 테두리로 '구조'를 드러냄) */
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

// hover 대상 레이어 찾기용 (매 이벤트마다 새로 만들지 않도록)
const _plane = new THREE.Plane()
const _normal = new THREE.Vector3()
const _point = new THREE.Vector3()
const _hit = new THREE.Vector3()
const _quat = new THREE.Quaternion()

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
  /** 포인터 아래 레이어 번호 (-1 = 없음)와 레이어별 hover 강조 진행값 */
  const hoverLayer = useRef(-1)
  const layerHover = useRef<number[]>([])
  /** 완전히 펼쳐진 시각 — 이후 부유가 서서히 가라앉음 */
  const openedAt = useRef<number | null>(null)
  const { hovered, toggled, handlers } = useExhibitInteraction('web-prototype', { toggle: true })

  // 세로 화면은 회전을 줄이고, 같은 원칙으로 깊이를 다시 계산(데스크톱보다 커지지 않게)
  const portrait = useThree((s) => s.size.width < s.size.height)
  const motion = useMemo(() => {
    const turn = portrait ? OPEN_TURN.portrait : OPEN_TURN.landscape
    return { turn, maxDepth: Math.min(maxDepthFor(turn), DESKTOP_MAX_DEPTH) }
  }, [portrait])

  const page = useMemo(() => createWebPrototypePage(), [])
  const shadowTexture = useMemo(() => createCardShadowTexture(), [])
  const geometry = useMemo(
    () => ({
      background: roundedRectGeometry(SCREEN.width, SCREEN.height, SCREEN.radius, 10),
      layers: page.layers.map((l) => new THREE.PlaneGeometry(l.w * PX, l.h * PX)),
      outlines: page.layers.map((l) => outlineGeometry(l.w * PX, l.h * PX)),
      shadows: page.layers.map((l) => new THREE.PlaneGeometry(l.w * PX * 1.06, l.h * PX * 1.24)),
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

  /** 포인터가 가리키는 화면 위 지점 → 그 자리에 있는 레이어 (작은 레이어 우선) */
  const pickLayer = (e: ThreeEvent<PointerEvent>) => {
    const browser = turnRef.current
    if (!browser) return
    browser.getWorldQuaternion(_quat)
    _normal.set(0, 0, 1).applyQuaternion(_quat)
    browser.localToWorld(_point.set(0, SCREEN.centerY, BROWSER_FACE_Z))
    _plane.setFromNormalAndCoplanarPoint(_normal, _point)
    if (!e.ray.intersectPlane(_plane, _hit)) return
    browser.worldToLocal(_hit)
    const px = _hit.x / PX + PAGE_PX.width / 2
    const py = PAGE_PX.height / 2 - (_hit.y - SCREEN.centerY) / PX
    let best = -1
    let bestArea = Infinity
    page.layers.forEach((l, i) => {
      const inside = px >= l.x && px <= l.x + l.w && py >= l.y && py <= l.y + l.h
      if (inside && l.w * l.h < bestArea) {
        best = i
        bestArea = l.w * l.h
      }
    })
    hoverLayer.current = best
  }

  const interaction = {
    ...handlers,
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      handlers.onPointerMove(e)
      if (e.pointerType !== 'touch') pickLayer(e)
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      handlers.onPointerOut(e)
      hoverLayer.current = -1
    },
  }

  useFrame(({ clock, pointer }, delta) => {
    const dt = Math.min(delta, 0.1)
    const t = clock.elapsedTime

    // 진행값: hover 는 부드러운 감쇠, 펼치기는 일정 속도(중간에 방향을 바꿔도 그 지점에서 되돌아감)
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

    // 완전히 펼쳐진 뒤의 부유는 서서히 가라앉아 정지
    if (o >= 1) openedAt.current ??= t
    else openedAt.current = null
    const settle = !animate ? 0 : openedAt.current === null ? 1 : Math.exp(-(t - openedAt.current) * SETTLE_RATE)

    const { maxDepth, turn } = motion
    const tierGap = maxDepth / page.maxTier
    const hoverEase = animate ? 1 - Math.exp(-dt * 8) : 1

    page.layers.forEach((l, i) => {
      const mesh = layerRefs.current[i]
      if (!mesh) return
      // ② 앞쪽 계층(내비게이션)부터 차례로 — 닫을 때는 같은 곡선을 거꾸로 따라 뒤쪽부터 자리로
      const rank = (page.maxTier - l.tier) / Math.max(page.maxTier - 1, 1)
      const oi = easeInOutCubic(clamp01((o - LAYER_START - rank * LAYER_SPREAD) / LAYER_DURATION))

      // hover: 포인터 아래 레이어만 조금 더 (부드럽게 옮겨 감)
      const target = hovered && hoverLayer.current === i ? 1 : 0
      const lh = (layerHover.current[i] ?? 0) + (target - (layerHover.current[i] ?? 0)) * hoverEase
      layerHover.current[i] = lh

      // ③ 펼친 직후 미세한 부유 (레이어마다 위상이 달라 자연스럽게)
      const drift = settle * oi
      const floatZ = FLOAT_Z * drift * Math.sin(t * 0.9 + i * 1.3)
      const floatY = FLOAT_Y * drift * Math.sin(t * 0.7 + i * 2.1)

      const [bx, by] = basePosition(l)
      const opened = l.tier * tierGap * oi
      const hoverLift = (l.tier * HOVER_PER_TIER * h + HOVER_TARGET * lh) * (1 - oi)
      const lift = opened + hoverLift + floatZ
      mesh.position.set(bx, by + floatY, 0.0008 + i * 0.0002 + lift)

      const outline = outlineRefs.current[i]
      if (outline) {
        outline.position.copy(mesh.position)
        const a = 0.5 * oi
        asMaterial(outline).opacity = a
        outline.visible = a > 0.01
      }
      const shadow = shadowRefs.current[i]
      if (shadow) {
        // 그림자는 화면 위에 남고, 왼쪽 위 빛을 기준으로 오른쪽 아래로 조금 비켜 퍼집니다
        const k = clamp01(lift / maxDepth)
        shadow.position.set(bx + 0.003 + k * 0.008, by - 0.004 - k * 0.012, 0.0005)
        shadow.scale.setScalar(1 + k * 0.12)
        const a = SHADOW_STRENGTH * clamp01(lift / 0.02) * (1 - k * 0.5)
        asMaterial(shadow).opacity = a
        shadow.visible = l.shadow && a > 0.004
      }
    })

    // 브라우저: 느린 부유 + 마우스 쪽 미세 기울기 + hover 시 살짝 앞으로 + ① 펼칠 때 돌아서기
    const e = easeInOutCubic(clamp01(o / TURN_END))
    if (floatRef.current) {
      floatRef.current.position.y = animate ? Math.sin(t * 0.55 + 2.1) * 0.02 : 0
      floatRef.current.position.z = HOVER_BROWSER * h * (1 - e)
      floatRef.current.rotation.z = animate ? Math.sin(t * 0.4 + 0.7) * 0.01 : 0
    }
    if (turnRef.current) {
      const follow = animate ? 1 - Math.exp(-dt * 2.5) : 1
      tilt.current.y += (pointer.x * 0.05 - tilt.current.y) * follow
      tilt.current.x += (-pointer.y * 0.03 - tilt.current.x) * follow
      const live = animate ? 1 - e * 0.6 : 0 // 펼친 상태에서는 기울기 반응을 줄여 안정적으로
      turnRef.current.rotation.set(
        OPEN_TILT * e + tilt.current.x * live,
        turn * e + tilt.current.y * live,
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
              <meshBasicMaterial map={page.background} color={SCREEN_TINT} toneMapped={false} />
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
                  <meshBasicMaterial
                    map={l.texture}
                    color={SCREEN_TINT}
                    transparent
                    depthWrite={false}
                    toneMapped={false}
                  />
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
                <lineBasicMaterial color="#b8955a" transparent opacity={0} depthWrite={false} />
              </lineLoop>
            ))}
          </Browser>
        </group>
      </group>

      {/* 마우스·터치 감지 영역 — 펼친 레이어까지 덮도록 넉넉하게, 화면에는 보이지 않음 */}
      <mesh {...interaction} position-z={0.14}>
        <boxGeometry args={[1.44, 1.0, 0.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}
