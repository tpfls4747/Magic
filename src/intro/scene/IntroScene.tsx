import { ContactShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { introClock, type IntroAnim } from '../animState'
import { GoldenKey } from './GoldenKey'
import { KEYHOLE, LOOK_TARGET } from './layout'
import { FloatingGlints, KeyholeLight, MagicBurst, MagicCircle, ZoomMotes } from './MagicEffects'
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

const BASE_FOV = 35
/** 확대가 끝났을 때의 시야각 */
const FILL_FOV = BASE_FOV + 9
/**
 * 화면을 가득 채웠을 때의 카메라 ~ 열쇠 구멍 거리.
 * 보이는 영역이 하트 몸체 안쪽(좌우 ±0.6, 아래 0.3)에 들어오도록 화면 비율에 맞춰 계산합니다.
 * near(0.05)보다 훨씬 멀어 근접 클리핑이 생기지 않습니다.
 */
function fillDistance(aspect: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(FILL_FOV / 2))
  // 세로 화면은 폭이 좁아 위아래로 더 넓게 보여도 하트 안쪽에 머무름
  const maxHalfH = THREE.MathUtils.lerp(0.6, 0.4, THREE.MathUtils.clamp((aspect - 0.6) / 0.6, 0, 1))
  return Math.min(0.76 / (t * aspect), maxHalfH / t)
}
/** 확대의 기준점 — 열쇠 구멍보다 조금 위(장식판과 보석 사이). 가득 찼을 때 하트 몸체가 화면을 채우고 열쇠 구멍은 빛나는 중심이 됩니다 */
const FOCUS = KEYHOLE.clone().add(new THREE.Vector3(0, 0.15, 0))

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
    const rad = ctx.createRadialGradient(256, 200, 10, 256, 200, 300)
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

/** 장면 시계 — 다른 useFrame 보다 먼저 등록되어 매 프레임 가장 먼저 갱신됩니다 */
function ClockDriver() {
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1) * introClock.scale
    introClock.delta = d
    introClock.time += d
  })
  return null
}

const _target = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _rel = new THREE.Vector3()
const _lat = new THREE.Vector3()
const smoothstep = (x: number) => x * x * (3 - 2 * x)

/**
 * 카메라: 화면 비율에 맞춘 거리 + 마우스 패럴랙스 + 3/4 측면 이동.
 *
 * 확대(Stage B): 자물쇠(lockRig)를 카메라 시선축 위로 끌어옵니다.
 *  - 거리는 지수 보간 d = d0·(dEnd/d0)^z → 처음엔 느리고 끝에서 폭발적으로 가속
 *  - 화면 중심에서 벗어나 있던 만큼은 부드럽게 중앙으로 수렴
 *  - 기준점을 축으로 살짝 비틀어 돌았다가 가득 찰 때 정면으로 정렬 → 2D 확대가 아닌 3D 접근
 *  - 시야각을 조금 넓혀 원근 왜곡을 강조
 */
function CameraAndRig({
  anim,
  rig,
  pivot,
  portrait,
  animate,
  keyholeWorld,
}: {
  anim: IntroAnim
  rig: RefObject<THREE.Group | null>
  pivot: RefObject<THREE.Group | null>
  portrait: boolean
  animate: boolean
  /** 매 프레임 갱신되는 열쇠 구멍의 월드 좌표 (마법 폭발의 발원점) */
  keyholeWorld: THREE.Vector3
}) {
  const { camera, size, pointer } = useThree()
  const smoothPointer = useRef(new THREE.Vector2())

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera
    const dt = introClock.delta

    // 시야각: 확대 끝 무렵 넓어지고, 폭발 순간 짧게 튕김
    const b = anim.magicBurst
    const kick = b > 0 ? Math.sin(Math.min(b / 0.22, 1) * Math.PI) * 4 : 0
    const fov = BASE_FOV + (FILL_FOV - BASE_FOV) * anim.zoom ** 2.2 + kick
    if (Math.abs(cam.fov - fov) > 1e-3) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    const aspect = size.width / size.height
    const halfTan = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2))
    // 가로: 자물쇠+열쇠 폭 / 세로: 자물쇠 폭 + 아래 열쇠, 아래쪽 30%는 제목 영역으로 비움
    const needHalfW = portrait ? 1.45 : 2.9
    const needHalfH = portrait ? 3.15 : 2.95
    const dist = Math.max(needHalfW / (halfTan * aspect), needHalfH / halfTan)
    const baseY = portrait ? -0.95 : -0.5

    const k = 1 - Math.exp(-dt * 4)
    smoothPointer.current.lerp(pointer, k)
    const px = smoothPointer.current.x * anim.parallax
    const py = smoothPointer.current.y * anim.parallax

    const side = anim.camSide * (portrait ? 0.6 : 1)
    // 세로 화면은 위아래 여유가 적으므로 측면 이동 시 살짝 물러서서 걸쇠가 잘리지 않게
    const back = portrait ? 0.9 : -0.3
    cam.position.set(px * 0.35 + side * 1.7, baseY + 0.25 + py * 0.2 + side * 0.15, dist + side * back)
    _target.set(LOOK_TARGET.x - side * 0.1, baseY + LOOK_TARGET.y + side * (portrait ? 0.45 : 0.32), 0)

    // 폭발 순간 아주 짧은 미세 진동
    if (animate && b > 0 && b < 0.25) {
      const a = (1 - b / 0.25) * 0.004
      cam.position.x += Math.sin(b * 230) * a
      cam.position.y += Math.cos(b * 190) * a
    }
    cam.lookAt(_target)

    const g = rig.current
    const pv = pivot.current
    if (!g || !pv) return
    const z = anim.zoom
    if (z <= 0) {
      g.position.set(0, 0, 0)
      pv.rotation.set(0, 0, 0)
      keyholeWorld.copy(KEYHOLE)
      return
    }
    cam.getWorldDirection(_fwd)
    _rel.copy(FOCUS).sub(cam.position)
    const d0 = _rel.dot(_fwd)
    _lat.copy(_rel).addScaledVector(_fwd, -d0)
    const dEnd = fillDistance(aspect) * (1 - anim.zoomHold * 0.08)
    const d = d0 * Math.pow(dEnd / d0, z)
    // rig 위치 = (카메라 + 시선축·d + 남은 측면 오프셋) - 원래 기준점 위치
    g.position
      .copy(cam.position)
      .addScaledVector(_fwd, d)
      .addScaledVector(_lat, 1 - smoothstep(Math.min(z * 1.15, 1)))
      .sub(FOCUS)

    const swing = Math.sin(z * Math.PI) * (1 - z * 0.35)
    pv.rotation.set(-0.14 * swing, 0.34 * swing, 0.05 * swing)
    keyholeWorld.copy(KEYHOLE).add(g.position)
  })
  return null
}

export function IntroScene({ anim, animate, interactive, lowQuality, onActivate }: IntroSceneProps) {
  useGradientBackground()
  const rig = useRef<THREE.Group>(null)
  const pivot = useRef<THREE.Group>(null)
  const shadows = useRef<THREE.Group>(null)
  const materials = useMemo(() => createIntroMaterials(), [])
  useEffect(() => () => materials.dispose(), [materials])
  const size = useThree((s) => s.size)
  const portrait = size.width / size.height < 0.85
  const focusNeg = useMemo(() => FOCUS.clone().negate(), [])
  const keyholeWorld = useMemo(() => KEYHOLE.clone(), [])

  useFrame(() => {
    if (shadows.current) shadows.current.visible = anim.zoom < 0.02
  })

  return (
    <>
      <ClockDriver />
      <CameraAndRig anim={anim} rig={rig} pivot={pivot} portrait={portrait} animate={animate} keyholeWorld={keyholeWorld} />
      <StudioEnvironment />
      <ambientLight intensity={0.3} color="#f6ecff" />
      <directionalLight position={[-3, 5, 4]} intensity={1.3} color="#fff1db" />
      <directionalLight position={[4, 1, -3]} intensity={0.9} color="#c9b6f2" />

      <MagicCircle anim={anim} animate={animate} />
      <FloatingGlints animate={animate} count={lowQuality ? 40 : 80} />

      {/* lockRig → (확대 기준점 피벗) → 자물쇠·열쇠 */}
      <group ref={rig}>
        <group ref={pivot} position={FOCUS}>
          <group position={focusNeg}>
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
            {animate && <ZoomMotes anim={anim} origin={KEYHOLE} count={lowQuality ? 50 : 90} />}
          </group>
        </group>
      </group>

      {animate && <MagicBurst anim={anim} lowQuality={lowQuality} origin={keyholeWorld} />}

      <group ref={shadows} position={[0, portrait ? -2.25 : -1.72, 0]}>
        <ContactShadows
          opacity={0.42}
          scale={portrait ? 5 : 7}
          blur={2.4}
          far={4}
          resolution={lowQuality ? 256 : 512}
          color="#5c4a6e"
          frames={animate ? Infinity : 60}
        />
      </group>
    </>
  )
}
