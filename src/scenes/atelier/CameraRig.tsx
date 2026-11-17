import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { tour } from '@/lib/tour'
import { OVERVIEW_CAMERA, SEAT_SWAP } from './exhibits/layout'

/** 기본 시점: 사람 눈높이에서 홀 깊숙이 바라보는 1점 투시 구도 */
const BASE_POSITION = OVERVIEW_CAMERA
const LOOK_AT = new THREE.Vector3(0, 2.15, -10)
/** 가로 화면 기준 세로 화각 */
const LANDSCAPE_FOV = 42
/** 세로(모바일) 화면에서 유지할 가로 화각 */
const PORTRAIT_HFOV = 50
/** 마우스에 반응하는 최대 이동량 (m) — 아주 미세하게 */
const PARALLAX = { x: 0.32, y: 0.14 }
/** 작품 근접 구도에서 남기는 패럴랙스 비율 — 가까운 거리에서 흔들림이 커지지 않도록 */
const PARALLAX_AT_EXHIBIT = 0.22

const toRad = THREE.MathUtils.degToRad
const toDeg = THREE.MathUtils.radToDeg
const UP = new THREE.Vector3(0, 1, 0)

interface Shot {
  position: THREE.Vector3
  target: THREE.Vector3
}

/**
 * 작품 근접 구도 계산.
 * 화면 비율에 따라 작품이 놓일 화면 위치와 차지할 비율을 정하고,
 * 거기에 맞는 카메라 거리와 시선 오프셋을 구합니다.
 *
 * - 가로 화면: 작품은 화면 왼쪽(약 33%), 오른쪽은 프로젝트 설명 패널
 * - 세로 화면: 작품은 화면 위쪽(약 33%), 아래는 설명 패널
 */
function exhibitShot(aspect: number, vfovDeg: number): Shot {
  const portrait = aspect < 1
  const vfov = toRad(vfovDeg)
  const viewH = 2 * Math.tan(vfov / 2) // 거리 1m 당 보이는 높이
  const viewW = viewH * aspect

  // 작품이 차지할 화면 비율(가로/세로)과 작품 중심의 화면 위치(0~1, 좌상단 기준)
  const frame = portrait
    ? { w: 0.8, h: 0.3, x: 0.5, y: 0.33 }
    : { w: 0.36, h: 0.4, x: 0.33, y: 0.47 }

  const { width, height } = SEAT_SWAP.extent
  const distance = Math.max(width / (frame.w * viewW), height / (frame.h * viewH))

  // 작품 정면 방향 (작품이 바라보는 쪽)
  const facing = new THREE.Vector3(Math.sin(SEAT_SWAP.yaw), 0, Math.cos(SEAT_SWAP.yaw))
  const right = new THREE.Vector3().crossVectors(facing.clone().negate(), UP).normalize()

  // 작품을 화면의 원하는 위치에 두기 위해 시선을 반대쪽으로 비킵니다.
  const target = SEAT_SWAP.center
    .clone()
    .addScaledVector(right, (0.5 - frame.x) * viewW * distance)
    .addScaledVector(UP, -(0.5 - frame.y) * viewH * distance)

  // 살짝 위에서 내려다보는 시선 (약 5°) — 티켓 윗면의 금박 모서리가 보이도록
  const elevation = toRad(5)
  const position = target
    .clone()
    .addScaledVector(facing, Math.cos(elevation) * distance)
    .addScaledVector(UP, Math.sin(elevation) * distance)

  return { position, target }
}

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/**
 * 카메라 리그
 * 1) 화면 비율에 맞춰 화각과 기본 구도를 조정하고
 * 2) 스크롤 진행값(tour.progress)에 따라 전체 구도 → 작품 근접 구도로 이동하며
 * 3) 그 위에 마우스 패럴랙스를 아주 작게 더합니다.
 * 세 요소를 한 곳에서 합성하므로 서로 충돌하지 않습니다.
 */
export function CameraRig({
  enableParallax,
  reducedMotion,
}: {
  enableParallax: boolean
  reducedMotion: boolean
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const size = useThree((s) => s.size)
  const pointer = useRef({ x: 0, y: 0 })

  // 화면 비율에 따른 화각, 전체 구도, 근접 구도
  const shots = useMemo(() => {
    const aspect = size.width / size.height
    let fov = LANDSCAPE_FOV
    let pullBack = 0
    if (aspect < 1.25) {
      // 세로 화면에서는 가로 화각을 유지하도록 세로 화각을 계산
      const vfov = 2 * toDeg(Math.atan(Math.tan(toRad(PORTRAIT_HFOV) / 2) / aspect))
      fov = THREE.MathUtils.clamp(vfov, LANDSCAPE_FOV, 74)
      pullBack = THREE.MathUtils.clamp((1.25 - aspect) * 0.8, 0, 0.6)
    }
    const overview: Shot = {
      position: BASE_POSITION.clone().add(new THREE.Vector3(0, 0, pullBack)),
      target: LOOK_AT.clone(),
    }
    return { fov, overview, exhibit: exhibitShot(aspect, fov) }
  }, [size.width, size.height])

  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    cam.fov = shots.fov
    cam.updateProjectionMatrix()
  }, [shots])

  // 캔버스 위에 UI 가 겹쳐도 동작하도록 window 에서 포인터를 읽습니다.
  useEffect(() => {
    if (!enableParallax) {
      pointer.current.x = 0
      pointer.current.y = 0
      return
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onLeave = () => {
      pointer.current.x = 0
      pointer.current.y = 0
    }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [enableParallax])

  const desiredPos = useRef(new THREE.Vector3())
  const desiredLook = useRef(new THREE.Vector3())
  const currentLook = useRef(LOOK_AT.clone())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  useFrame((_, delta) => {
    const cam = cameraRef.current
    if (!cam) return
    const dt = Math.min(delta, 0.1)
    const { overview, exhibit } = shots

    // 스크롤 진행값 → 이징. 애니메이션 감소 설정에서는 이동 과정 없이 두 구도 사이를 전환합니다.
    const p = THREE.MathUtils.clamp(tour.progress, 0, 1)
    const e = reducedMotion ? (p < 0.5 ? 0 : 1) : easeInOutSine(p)

    // 위치와 시선을 함께 보간 — 이동 중간에 살짝 떠오르는 완만한 곡선
    desiredPos.current.lerpVectors(overview.position, exhibit.position, e)
    desiredPos.current.y += Math.sin(e * Math.PI) * 0.22
    desiredLook.current.lerpVectors(overview.target, exhibit.target, e)

    // 마우스 패럴랙스: 현재 시선 기준의 좌우/상하로, 작품에 가까울수록 약하게
    const amount = THREE.MathUtils.lerp(1, PARALLAX_AT_EXHIBIT, e)
    const { x, y } = pointer.current
    forward.current.subVectors(desiredLook.current, desiredPos.current).normalize()
    right.current.crossVectors(forward.current, UP).normalize()
    desiredPos.current
      .addScaledVector(right.current, x * PARALLAX.x * amount)
      .addScaledVector(UP, y * PARALLAX.y * amount)
    // 시선은 반대 방향으로 아주 조금 — 공간을 들여다보는 시차감
    desiredLook.current
      .addScaledVector(right.current, -x * 0.25 * amount)
      .addScaledVector(UP, -y * 0.08 * amount)

    if (!initialized.current || reducedMotion) {
      // 첫 프레임과 애니메이션 감소 설정: 감쇠 없이 바로 적용
      cam.position.copy(desiredPos.current)
      currentLook.current.copy(desiredLook.current)
      initialized.current = true
    } else {
      // 프레임 속도와 무관한 지수 감쇠 — 위치와 시선에 같은 감쇠를 적용해 흔들림 없이 따라갑니다.
      const k = 1 - Math.exp(-dt * 3)
      cam.position.lerp(desiredPos.current, k)
      currentLook.current.lerp(desiredLook.current, k)
    }
    cam.lookAt(currentLook.current)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={LANDSCAPE_FOV}
      near={0.05}
      far={80}
      position={BASE_POSITION.toArray()}
    />
  )
}
