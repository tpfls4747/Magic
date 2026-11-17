import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SIGN_UP } from './layout'
import { Phone } from './Phone'
import { PHONE, roundedRectGeometry } from './phoneGeometry'
import {
  createCardShadowTexture,
  createSignupScreens,
  SCREEN_PX,
  type ScreenElement,
} from './signupScreens'
import { useExhibitInteraction } from './useExhibitInteraction'

/**
 * 작품 2 — Sign-up Redesign: 회원가입 UX 리디자인
 * 오른쪽 전시대 위에 떠 있는 스마트폰. 마우스를 올리면(모바일은 탭)
 * 기존 화면의 UI 요소들이 화면 위로 입체적으로 떠올라 흩어지고,
 * 개선된 화면의 요소들이 그 자리에 다시 내려앉으며 정렬됩니다.
 */

/** 전체 전환에 걸리는 시간 (초) */
const TRANSITION_DURATION = 2.2
/** 화면 논리 픽셀 → m */
const PX = PHONE.screenWidth / SCREEN_PX.width


const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** 요소마다 고정된 의사 난수 (분리 깊이·방향에 변화를 줌) */
const hash = (i: number, salt: number) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** UI 레이어 한 장의 배치 정보 (읽기 전용) */
interface LayerSpec {
  texture: THREE.Texture
  size: [number, number]
  base: [number, number, number]
  /** 떠오르는 최대 깊이 (m) */
  depth: number
  drift: [number, number]
  tilt: [number, number]
  /** 0~1, 위에서 아래 순서 */
  order: number
  renderOrder: number
  /** 카드형 요소는 떠오를 때 화면에 그림자를 드리웁니다 */
  card: boolean
}

function layerSpec(el: ScreenElement, i: number, count: number, zIndex: number): LayerSpec {
  return {
    texture: el.texture,
    size: [el.w * PX, el.h * PX],
    base: [
      (el.x + el.w / 2 - SCREEN_PX.width / 2) * PX,
      (SCREEN_PX.height / 2 - (el.y + el.h / 2)) * PX,
      0.0009 + zIndex * 0.00004,
    ],
    // 스마트폰에서 너무 멀리 벗어나지 않도록: 3.5~7.5cm 위로, 옆으로는 1cm 이내
    depth: 0.035 + hash(i, 1) * 0.04,
    drift: [(hash(i, 2) - 0.5) * 0.018, 0.003 + hash(i, 3) * 0.006],
    tilt: [(hash(i, 4) - 0.5) * 0.12, (hash(i, 5) - 0.5) * 0.12],
    order: count > 1 ? i / (count - 1) : 0,
    renderOrder: 3 + zIndex,
    card: el.card,
  }
}

function Layer({
  spec,
  meshRef,
}: {
  spec: LayerSpec
  meshRef: (mesh: THREE.Mesh | null) => void
}) {
  return (
    <mesh ref={meshRef} position={spec.base} renderOrder={spec.renderOrder}>
      <planeGeometry args={spec.size} />
      <meshBasicMaterial map={spec.texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** 떠오른 카드 아래 화면 표면의 그림자 */
function CardShadow({
  spec,
  texture,
  meshRef,
}: {
  spec: LayerSpec
  texture: THREE.Texture
  meshRef: (mesh: THREE.Mesh | null) => void
}) {
  return (
    <mesh ref={meshRef} position={[spec.base[0], spec.base[1], 0.0006]} renderOrder={2} visible={false}>
      <planeGeometry args={[spec.size[0] * 1.1, spec.size[1] * 1.45]} />
      <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** 그림자 최대 진하기 */
const SHADOW_STRENGTH = 0.45

const opacityOf = (mesh: THREE.Mesh) => mesh.material as THREE.MeshBasicMaterial

function setShadow(mesh: THREE.Mesh | null | undefined, lift: number, layerOpacity: number) {
  if (!mesh) return
  const opacity = SHADOW_STRENGTH * lift * layerOpacity
  opacityOf(mesh).opacity = opacity
  mesh.visible = opacity > 0.002
  // 떠오를수록 그림자가 조금 더 넓고 아래로 퍼집니다
  mesh.scale.setScalar(1 + lift * 0.12)
}

export function SignupExhibit({
  animate,
  castShadow,
}: {
  animate: boolean
  castShadow: boolean
}) {
  const floatRef = useRef<THREE.Group>(null)
  const phoneRef = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const { active, handlers } = useExhibitInteraction(4200)

  const screens = useMemo(() => createSignupScreens(), [])

  const layout = useMemo(() => {
    const nb = screens.before.elements.length
    const na = screens.after.elements.length
    return {
      before: screens.before.elements.map((el, i) => layerSpec(el, i, nb, i)),
      after: screens.after.elements.map((el, i) => layerSpec(el, i, na, nb + i)),
    }
  }, [screens])
  const bgGeo = useMemo(
    () => roundedRectGeometry(PHONE.screenWidth, PHONE.screenHeight, PHONE.screenRadius, 16),
    [],
  )
  const shadowTexture = useMemo(() => createCardShadowTexture(), [])
  useEffect(() => () => screens.dispose(), [screens])
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture])
  useEffect(() => () => bgGeo.dispose(), [bgGeo])

  // 프레임마다 움직이는 메시는 ref 로 다룹니다.
  const beforeMeshes = useRef<(THREE.Mesh | null)[]>([])
  const afterMeshes = useRef<(THREE.Mesh | null)[]>([])
  const bgAfterRef = useRef<THREE.Mesh>(null)
  const beforeShadows = useRef<(THREE.Mesh | null)[]>([])
  const afterShadows = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }, delta) => {
    // 진행값: 목표(0 또는 1)를 향해 일정 속도로 — 중간에 방향이 바뀌어도 그 지점에서 자연스럽게 되돌아갑니다.
    const target = active ? 1 : 0
    if (animate) {
      const step = Math.min(delta, 0.1) / TRANSITION_DURATION
      progress.current += THREE.MathUtils.clamp(target - progress.current, -step, step)
    } else {
      progress.current = target
    }
    const p = progress.current

    // ── 기존 화면 요소: 위에서부터 차례로 화면 위로 떠오르며 흩어지고 사라짐
    layout.before.forEach((l, i) => {
      const mesh = beforeMeshes.current[i]
      if (!mesh) return
      const u = easeOutCubic(clamp01((p - l.order * 0.12) / 0.5))
      mesh.position.set(l.base[0] + l.drift[0] * u, l.base[1] + l.drift[1] * u, l.base[2] + l.depth * u)
      mesh.rotation.set(l.tilt[0] * u, l.tilt[1] * u, 0)
      // 충분히 떠오른 뒤에야 사라지도록 — 분리되는 모습이 보이게
      const opacity = 1 - smoothstep(0.62, 1, u)
      opacityOf(mesh).opacity = opacity
      mesh.visible = opacity > 0.002
      setShadow(beforeShadows.current[i], u, opacity)
    })

    // ── 배경 전환
    if (bgAfterRef.current) opacityOf(bgAfterRef.current).opacity = smoothstep(0.18, 0.52, p)

    // ── 개선된 화면 요소: 떠 있는 위치에서 화면으로 내려앉으며 정렬
    layout.after.forEach((l, i) => {
      const mesh = afterMeshes.current[i]
      if (!mesh) return
      // 기존 요소가 사라지기 전에 새 요소가 나타나기 시작 — 화면이 하얗게 비는 순간이 없도록
      const v = clamp01((p - 0.24 - l.order * 0.1) / 0.5)
      const lift = 1 - easeInOutCubic(v)
      mesh.position.set(
        l.base[0] - l.drift[0] * 0.6 * lift,
        l.base[1] - l.drift[1] * lift,
        l.base[2] + l.depth * lift,
      )
      mesh.rotation.set(-l.tilt[0] * 0.6 * lift, -l.tilt[1] * 0.6 * lift, 0)
      const opacity = smoothstep(0, 0.35, v)
      opacityOf(mesh).opacity = opacity
      mesh.visible = opacity > 0.002
      setShadow(afterShadows.current[i], lift, opacity)
    })

    // ── 휴대폰: 아주 느린 부유 + 전환 중 아주 조금 돌아서 레이어의 깊이를 보여줌
    const float = floatRef.current
    const phone = phoneRef.current
    if (float) {
      const t = clock.elapsedTime
      float.position.y = animate ? Math.sin(t * 0.6 + 1.1) * 0.02 : 0
      float.rotation.z = animate ? Math.sin(t * 0.45 + 0.4) * 0.012 : 0
      float.rotation.x = animate ? Math.sin(t * 0.38) * 0.015 : 0
    }
    if (phone) {
      // 전환 도중에만 약 4° 정도 돌아섰다가 제자리로 — 과한 회전 없이
      phone.rotation.y = SIGN_UP.turn + Math.sin(easeInOutCubic(p) * Math.PI) * 0.07
    }
  })

  return (
    <group position={SIGN_UP.center} rotation-y={SIGN_UP.yaw}>
      <group ref={floatRef}>
        <group ref={phoneRef} rotation={[SIGN_UP.tilt, SIGN_UP.turn, 0]}>
          <Phone castShadow={castShadow}>
            <mesh geometry={bgGeo} renderOrder={1}>
              <meshBasicMaterial map={screens.before.background} toneMapped={false} />
            </mesh>
            <mesh ref={bgAfterRef} geometry={bgGeo} position-z={0.0004} renderOrder={1}>
              <meshBasicMaterial
                map={screens.after.background}
                toneMapped={false}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>
            {layout.before.map(
              (spec, i) =>
                spec.card && (
                  <CardShadow
                    key={`bs${i}`}
                    spec={spec}
                    texture={shadowTexture}
                    meshRef={(m) => void (beforeShadows.current[i] = m)}
                  />
                ),
            )}
            {layout.after.map(
              (spec, i) =>
                spec.card && (
                  <CardShadow
                    key={`as${i}`}
                    spec={spec}
                    texture={shadowTexture}
                    meshRef={(m) => void (afterShadows.current[i] = m)}
                  />
                ),
            )}
            {layout.before.map((spec, i) => (
              <Layer key={`b${i}`} spec={spec} meshRef={(m) => void (beforeMeshes.current[i] = m)} />
            ))}
            {layout.after.map((spec, i) => (
              <Layer key={`a${i}`} spec={spec} meshRef={(m) => void (afterMeshes.current[i] = m)} />
            ))}
          </Phone>
        </group>
      </group>

      {/* 마우스·터치 감지 영역 — 화면에는 보이지 않음 */}
      <mesh {...handlers}>
        <boxGeometry args={[0.66, 0.98, 0.45]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}
