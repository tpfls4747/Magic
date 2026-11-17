import { ContactShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { IntroAnim } from '../animState'
import { GoldenKey } from './GoldenKey'
import { KEYHOLE, LOOK_TARGET } from './layout'
import { FloatingGlints, KeyholeLight, MagicCircle } from './MagicEffects'
import { createIntroMaterials } from './materials'
import { Padlock } from './Padlock'
import { StudioEnvironment } from './StudioEnvironment'

interface IntroSceneProps {
  anim: IntroAnim
  animate: boolean
  interactive: boolean
  lowQuality: boolean
  onActivate: () => void
}

/** 크림 → 라벤더 세로 그라데이션 배경 (+ 중앙 밝은 후광) */
function useGradientBackground() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const ctx = c.getContext('2d')!
    const lin = ctx.createLinearGradient(0, 0, 0, 512)
    lin.addColorStop(0, '#f7f0e4')
    lin.addColorStop(0.55, '#efe4dc')
    lin.addColorStop(1, '#d9cdea')
    ctx.fillStyle = lin
    ctx.fillRect(0, 0, 512, 512)
    const rad = ctx.createRadialGradient(256, 220, 10, 256, 220, 300)
    rad.addColorStop(0, 'rgba(255,250,240,0.9)')
    rad.addColorStop(1, 'rgba(255,250,240,0)')
    ctx.fillStyle = rad
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    const prev = scene.background
    scene.background = tex
    return () => {
      scene.background = prev
      tex.dispose()
    }
  }, [scene])
}

const _target = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _k = new THREE.Vector3()

/**
 * 카메라: 화면 비율에 맞춰 거리 조정 + 마우스 패럴랙스 + 3/4 측면 이동.
 * 줌 단계에서는 자물쇠(lockRig)를 카메라 앞으로 끌어와 열쇠 구멍이 화면 중앙을 채우게 합니다.
 */
function CameraAndRig({ anim, rig, portrait }: { anim: IntroAnim; rig: RefObject<THREE.Group | null>; portrait: boolean }) {
  const { camera, size, pointer } = useThree()
  const smoothPointer = useRef(new THREE.Vector2())

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const halfTan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    // 가로: 자물쇠+열쇠가 들어갈 폭, 세로: 자물쇠 폭 기준 + 아래 열쇠 공간
    const needHalfW = portrait ? 1.45 : 2.9
    const needHalfH = portrait ? 3.1 : 2.85
    const dist = Math.max(needHalfW / (halfTan * aspect), needHalfH / halfTan)
    const baseY = portrait ? -0.95 : -0.32

    const k = 1 - Math.exp(-dt * 4)
    smoothPointer.current.lerp(pointer, k)
    const px = smoothPointer.current.x * anim.parallax
    const py = smoothPointer.current.y * anim.parallax

    const side = anim.camSide
    cam.position.set(px * 0.35 + side * 1.7, baseY + 0.25 + py * 0.2 + side * 0.35, dist - side * 0.4)
    _target.set(LOOK_TARGET.x - side * 0.1, baseY + LOOK_TARGET.y + side * 0.12, 0)
    cam.lookAt(_target)

    // 줌: 열쇠 구멍을 카메라 바로 앞(0.6)으로
    const g = rig.current
    if (g) {
      const z = anim.zoom
      cam.getWorldDirection(_fwd)
      _k.copy(cam.position).addScaledVector(_fwd, 0.6).sub(KEYHOLE)
      g.position.copy(_k).multiplyScalar(z)
      g.rotation.y = 0
    }
  })
  return null
}

export function IntroScene({ anim, animate, interactive, lowQuality, onActivate }: IntroSceneProps) {
  useGradientBackground()
  const rig = useRef<THREE.Group>(null)
  const shadows = useRef<THREE.Group>(null)
  const materials = useMemo(() => createIntroMaterials(), [])
  useEffect(() => () => materials.dispose(), [materials])
  const size = useThree((s) => s.size)
  const portrait = size.width / size.height < 0.85

  useFrame(() => {
    if (shadows.current) shadows.current.visible = anim.zoom < 0.05
  })

  return (
    <>
      <CameraAndRig anim={anim} rig={rig} portrait={portrait} />
      <StudioEnvironment />
      <ambientLight intensity={0.25} color="#f4e9ff" />
      <directionalLight position={[-3, 5, 4]} intensity={1.6} color="#fff1db" />
      <directionalLight position={[4, 1, -3]} intensity={1.1} color="#c9b6f2" />

      <MagicCircle anim={anim} animate={animate} />
      <FloatingGlints animate={animate} count={lowQuality ? 40 : 80} />

      <group ref={rig}>
        <Padlock anim={anim} materials={materials} animate={animate} />
        <GoldenKey
          anim={anim}
          materials={materials}
          animate={animate}
          interactive={interactive}
          portrait={portrait}
          onActivate={onActivate}
        />
        <KeyholeLight anim={anim} origin={KEYHOLE} />
      </group>

      <group ref={shadows} position={[0, portrait ? -2.45 : -1.7, 0]}>
        <ContactShadows
          opacity={0.38}
          scale={portrait ? 5 : 7}
          blur={2.6}
          far={4}
          resolution={lowQuality ? 256 : 512}
          color="#5c4a6e"
          frames={animate ? Infinity : 60}
        />
      </group>
    </>
  )
}
