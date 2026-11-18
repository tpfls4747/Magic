import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { doorClock, type DoorAnim } from '../animState'
import { ArchDoorway } from './ArchDoorway'
import { Beyond } from './Beyond'
import { DoorLeaf } from './DoorLeaf'
import { archOpeningShape } from './geometry'
import { DOOR, DOOR_BOX, LEAF_FRONT_Z, WALL_FRONT_Z } from './layout'
import { createDoorMaterials } from './materials'
import { DoorSparkles } from './Sparkles'

export interface DoorSceneProps {
  anim: DoorAnim
  animate: boolean
  lowQuality: boolean
  /** 문을 클릭·탭할 수 있는 상태인지 (닫혀 있을 때만) */
  interactive: boolean
  onActivate: () => void
  onHover: (hovering: boolean) => void
}

const FOV = 35

/** 화면 비율에 따라 문 영역을 넣을 화면 위치 (0~1, y 는 아래에서부터) */
interface Region {
  x0: number
  x1: number
  y0: number
  y1: number
}
const REGIONS = {
  // 닫힘: 위쪽 ~27%는 헤드라인, 아래 ~15%는 CTA
  closedLandscape: { x0: 0.22, x1: 0.78, y0: 0.15, y1: 0.66 },
  closedPortrait: { x0: 0.06, x1: 0.94, y0: 0.2, y1: 0.66 },
  // 열림: 문이 커지며 오른쪽(가로) / 위쪽(세로)으로, 남은 자리에 연락처 패널
  openLandscape: { x0: 0.52, x1: 0.94, y0: 0.07, y1: 0.9 },
  openPortrait: { x0: 0.1, x1: 0.9, y0: 0.5, y1: 0.98 },
} satisfies Record<string, Region>

/**
 * 문+문틀 상자를 화면의 region 에 정확히 맞추는 카메라 위치.
 * 카메라는 정면(-Z)을 바라보아 건축 사진처럼 수직선이 곧게 유지됩니다.
 */
function frameCamera(aspect: number, r: Region, out: THREE.Vector3) {
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const bw = DOOR_BOX.xMax - DOOR_BOX.xMin
  const bh = DOOR_BOX.yMax - DOOR_BOX.yMin
  const d = Math.max(bw / ((r.x1 - r.x0) * 2 * tan * aspect), bh / ((r.y1 - r.y0) * 2 * tan))
  const W = 2 * d * tan * aspect
  const Hh = 2 * d * tan
  const cx = (DOOR_BOX.xMin + DOOR_BOX.xMax) / 2 - ((r.x0 + r.x1) / 2 - 0.5) * W
  const cy = (DOOR_BOX.yMin + DOOR_BOX.yMax) / 2 - ((r.y0 + r.y1) / 2 - 0.5) * Hh
  return out.set(cx, cy, WALL_FRONT_Z + d)
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()

function CameraRig({ anim, animate }: { anim: DoorAnim; animate: boolean }) {
  const { camera, size, pointer } = useThree()
  const sp = useRef(new THREE.Vector2())
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1) * doorClock.scale
    doorClock.delta = d
    doorClock.time += d

    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const portrait = aspect < 0.9
    frameCamera(aspect, portrait ? REGIONS.closedPortrait : REGIONS.closedLandscape, _a)
    frameCamera(aspect, portrait ? REGIONS.openPortrait : REGIONS.openLandscape, _b)
    _a.lerp(_b, anim.cam)

    sp.current.lerp(pointer, 1 - Math.exp(-d * 3))
    const par = animate ? anim.parallax : 0
    cam.position.set(_a.x + sp.current.x * 0.25 * par, _a.y + sp.current.y * 0.12 * par, _a.z)
    cam.lookAt(_a.x + sp.current.x * 0.08 * par, _a.y, 0)
  })
  return null
}

function StudioLight() {
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#8a8682']} />
      <Lightformer form="rect" intensity={0.7} color="#fff1dc" position={[0, 1, 7]} scale={[10, 6, 1]} />
      <Lightformer form="rect" intensity={2.2} color="#fff6e8" position={[-2.4, 1, 6.5]} scale={[0.7, 8, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#efe2ff" position={[2.6, 1, 6.5]} scale={[0.5, 8, 1]} />
      <Lightformer form="rect" intensity={2.0} color="#fff4e2" position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#cbb8f0" position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[7, 1.2, 1]} />
      <Lightformer form="rect" intensity={1.1} color="#efd2a2" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[9, 4, 1]} />
    </Environment>
  )
}

export function DoorScene({ anim, animate, lowQuality, interactive, onActivate, onHover }: DoorSceneProps) {
  const materials = useMemo(() => createDoorMaterials(), [])
  useEffect(() => () => materials.dispose(), [materials])
  const shadows = !lowQuality
  const scene = useThree((s) => s.scene)

  // 실내 공기 — 멀리 갈수록 크림빛 안개
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#ece6de', 18, 46)
    return () => {
      scene.fog = null
    }
  }, [scene])

  const hitGeo = useMemo(() => new THREE.ShapeGeometry(archOpeningShape(DOOR.halfWidth + 0.35, DOOR.spring), 32), [])
  useEffect(() => () => hitGeo.dispose(), [hitGeo])

  // hover: 손잡이·테두리 금빛 하이라이트
  useFrame(() => {
    materials.handleGold.emissiveIntensity = anim.hover * 0.45
    materials.gold.emissiveIntensity = anim.hover * 0.12
    materials.gem.emissiveIntensity = 0.15 + anim.hover * 0.35 + anim.light * 0.3
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (interactive) onHover(true)
  }
  const out = () => onHover(false)
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (interactive) onActivate()
  }

  return (
    <>
      <color attach="background" args={['#ece6de']} />
      <CameraRig anim={anim} animate={animate} />
      <StudioLight />
      <hemisphereLight args={['#ffffff', '#ddd8e4', 0.42]} />
      <directionalLight
        position={[-2.6, 8, 9]}
        intensity={2.3}
        color="#fff6ea"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={7}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[5, 3, 6]} intensity={0.45} color="#dcd0f6" />

      <ArchDoorway materials={materials} shadows={shadows} />
      <DoorLeaf side="left" anim={anim} materials={materials} />
      <DoorLeaf side="right" anim={anim} materials={materials} />
      <Beyond anim={anim} shadows={shadows} />
      <DoorSparkles anim={anim} animate={animate} front={lowQuality ? 80 : 150} beyond={lowQuality ? 30 : 60} />

      {/* 클릭 판정: 문 + 문틀 앞의 보이지 않는 면 — 작은 손잡이를 정확히 누를 필요 없음 */}
      <mesh
        geometry={hitGeo}
        position={[0, 0, LEAF_FRONT_Z + 0.02]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <ContactShadows
        position={[0, 0.006, 0.9]}
        scale={[9, 2.4]}
        opacity={0.32}
        blur={2.2}
        far={1.6}
        resolution={lowQuality ? 256 : 512}
        color="#6b5a72"
        frames={1}
      />
    </>
  )
}
