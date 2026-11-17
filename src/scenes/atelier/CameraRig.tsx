import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/** 기본 시점: 사람 눈높이에서 홀 깊숙이 바라보는 1점 투시 구도 */
const BASE_POSITION = new THREE.Vector3(0, 1.72, 7.2)
const LOOK_AT = new THREE.Vector3(0, 2.15, -10)
/** 가로 화면 기준 세로 화각 */
const LANDSCAPE_FOV = 42
/** 세로(모바일) 화면에서 유지할 가로 화각 */
const PORTRAIT_HFOV = 50
/** 마우스에 반응하는 최대 이동량 (m) — 아주 미세하게 */
const PARALLAX = { x: 0.32, y: 0.14 }

const toRad = THREE.MathUtils.degToRad
const toDeg = THREE.MathUtils.radToDeg

/**
 * 화면 비율에 맞춰 화각과 위치를 조정하고,
 * 마우스 위치에 따라 카메라를 부드럽게(감쇠) 움직이는 리그.
 */
export function CameraRig({ enableParallax }: { enableParallax: boolean }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const size = useThree((s) => s.size)
  const pointer = useRef({ x: 0, y: 0 })
  const base = useRef(BASE_POSITION.clone())
  const look = useRef(LOOK_AT.clone())

  // 화면 비율에 따른 화각/거리 보정
  useEffect(() => {
    const cam = cameraRef.current
    if (!cam) return
    const aspect = size.width / size.height
    let fov = LANDSCAPE_FOV
    let pullBack = 0
    if (aspect < 1.25) {
      // 세로 화면에서는 가로 화각을 유지하도록 세로 화각을 계산
      const vfov = 2 * toDeg(Math.atan(Math.tan(toRad(PORTRAIT_HFOV) / 2) / aspect))
      fov = THREE.MathUtils.clamp(vfov, LANDSCAPE_FOV, 74)
      pullBack = THREE.MathUtils.clamp((1.25 - aspect) * 0.8, 0, 0.6)
    }
    cam.fov = fov
    cam.updateProjectionMatrix()
    base.current.copy(BASE_POSITION).add(new THREE.Vector3(0, 0, pullBack))
    cam.position.copy(base.current)
    cam.lookAt(look.current)
  }, [size.width, size.height])

  // 캔버스 위에 UI 가 겹쳐도 동작하도록 window 에서 포인터를 읽습니다.
  useEffect(() => {
    if (!enableParallax) return
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

  const desired = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const cam = cameraRef.current
    if (!cam) return
    const dt = Math.min(delta, 0.1)
    const { x, y } = pointer.current
    desired.current.set(
      base.current.x + x * PARALLAX.x,
      base.current.y + y * PARALLAX.y,
      base.current.z,
    )
    // 프레임 속도와 무관한 지수 감쇠
    const k = 1 - Math.exp(-dt * 2.2)
    cam.position.lerp(desired.current, k)
    // 시선은 반대 방향으로 아주 조금 — 공간을 들여다보는 시차감
    lookTarget.current.set(look.current.x - x * 0.25, look.current.y - y * 0.08, look.current.z)
    cam.lookAt(lookTarget.current)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={LANDSCAPE_FOV}
      near={0.1}
      far={80}
      position={BASE_POSITION.toArray()}
    />
  )
}
