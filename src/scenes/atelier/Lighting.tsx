import { Environment, Lightformer } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { HALL, PALETTE, PEDESTALS } from './constants'
import { PEDESTAL_HEIGHT } from './Pedestals'

/** 전시대마다 위에서 떨어지는 부드러운 스포트라이트 */
function PedestalSpot({
  position,
  castShadow,
}: {
  position: [number, number, number]
  castShadow: boolean
}) {
  const [x, , z] = position
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(x, PEDESTAL_HEIGHT * 0.6, z)
    return o
  }, [x, z])

  return (
    <>
      <primitive object={target} />
      <spotLight
        position={[x * 1.15, 6.4, z + 2.2]}
        target={target}
        color={PALETTE.warmLight}
        intensity={62}
        angle={0.32}
        penumbra={1}
        distance={14}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={6}
      />
    </>
  )
}

/** 그림자를 만드는 따뜻한 주광 — 기둥 그림자가 바닥에 사선으로 길게 드리워집니다. */
function KeyLight({ mapSize }: { mapSize: number }) {
  const target = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    target.position.set(0, 0, -6)
  }, [target])

  return (
    <>
      <primitive object={target} />
      <directionalLight
        position={[-9, 15, 9]}
        target={target}
        color={PALETTE.warmLight}
        intensity={3.1}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-radius={5}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  )
}

/** 라벤더 간접광을 둘 측면 아치 (카메라에 보이는 구간) */
const BOUNCE_Z_HIGH = [-12, -8, -4, 0]
const BOUNCE_Z_LOW = [-10, -2]

/**
 * 측면 아치 너머 회랑에서 번지는 라벤더빛 간접조명.
 * 도달 거리를 짧게 제한해 기둥 뒷면·아치 안쪽 면·벽 가까운 바닥만 물들이고,
 * 홀 중앙의 골드 전시대에는 닿지 않게 해 금색이 탁해지지 않도록 합니다.
 */
function LavenderBounce({ quality }: { quality: 'high' | 'low' }) {
  const zs = quality === 'high' ? BOUNCE_Z_HIGH : BOUNCE_Z_LOW
  return (
    <>
      {zs.flatMap((z) =>
        [-1, 1].map((side) => (
          <pointLight
            key={`${side}${z}`}
            position={[side * 7.1, 2.3, z]}
            color="#b4a4e6"
            intensity={quality === 'high' ? 9 : 13}
            distance={3.9}
            decay={1.6}
          />
        )),
      )}
    </>
  )
}

/**
 * 반사(환경맵)를 위한 가상의 스튜디오 조명.
 * 외부 HDRI 없이 Lightformer 로 만든 큐브맵이라 로딩이 빠릅니다.
 * 원통형 전시대에 가늘고 긴 세로 하이라이트가 맺히도록 스트립 소프트박스를 배치하고,
 * 한쪽 스트립에만 아주 옅은 라벤더를 섞어 금색이 탁해지지 않게 색 변화를 줍니다.
 */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.5}>
      <color attach="background" args={['#e4d8c6']} />
      {/* 천장 채광 */}
      <Lightformer form="rect" intensity={2.4} color={PALETTE.warmLight} position={[0, 8, -4]} rotation-x={Math.PI / 2} scale={[2.5, 30, 1]} />
      {/* 좌우 회랑 — 금속 반사가 모브빛으로 탁해지지 않도록 중성에 가깝게 */}
      {[-1, 1].map((s) => (
        <Lightformer key={s} form="rect" intensity={1.05} color="#f1ebe8" position={[s * 8, 2.5, -4]} rotation-y={(-s * Math.PI) / 2} scale={[24, 3, 1]} />
      ))}
      {/* 뒤쪽 포털 */}
      <Lightformer form="rect" intensity={1.6} color="#f7e6cc" position={[0, 3, HALL.backZ - 2]} scale={[5, 6, 1]} />
      {/* 전시대용 세로 스트립 소프트박스 — 선명하고 가는 하이라이트 */}
      <Lightformer form="rect" intensity={4} color="#fff7ea" position={[-4.5, 2.5, 6]} rotation-y={Math.PI * 0.82} scale={[0.6, 6, 1]} />
      <Lightformer form="rect" intensity={2.4} color="#efe9f4" position={[4.5, 2.5, 6]} rotation-y={-Math.PI * 0.82} scale={[0.6, 6, 1]} />
      {/* 정면의 아주 약한 채움광 */}
      <Lightformer form="rect" intensity={0.5} color={PALETTE.ivory} position={[0, 3, 10]} rotation-y={Math.PI} scale={[12, 5, 1]} />
    </Environment>
  )
}

export function Lighting({ quality }: { quality: 'high' | 'low' }) {
  const high = quality === 'high'
  return (
    <>
      {/* 위에서 오는 빛은 따뜻하게, 아래를 향한 면(볼트 천장, 아치 밑면)은 라벤더빛 반사 */}
      <hemisphereLight args={['#fff4e6', '#cbbfe6', 0.34]} />
      <KeyLight mapSize={high ? 2048 : 1024} />
      {PEDESTALS.map(({ position }, i) => (
        <PedestalSpot key={i} position={position} castShadow={high} />
      ))}
      <LavenderBounce quality={quality} />
      {/* 포털 안쪽의 은은한 빛 — 디테일이 묻히지 않도록 약하게 */}
      <pointLight position={[0, 3.2, HALL.backZ - 2.5]} intensity={12} distance={16} decay={2} color="#f6e4cc" />
      <StudioEnvironment />
    </>
  )
}
