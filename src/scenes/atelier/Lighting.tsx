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
        intensity={70}
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
        intensity={2.8}
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

/**
 * 반사(환경맵)를 위한 가상의 스튜디오 조명.
 * 외부 HDRI 없이 Lightformer 로 만든 큐브맵이라 로딩이 빠르고,
 * 금속 표면에 길고 부드러운 하이라이트를 만듭니다.
 */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.55}>
      <color attach="background" args={[PALETTE.cream]} />
      {/* 천장 채광 */}
      <Lightformer form="rect" intensity={3} color={PALETTE.warmLight} position={[0, 8, -4]} rotation-x={Math.PI / 2} scale={[3, 30, 1]} />
      {/* 좌우 아치에서 들어오는 빛 */}
      {[-1, 1].map((s) => (
        <Lightformer key={s} form="rect" intensity={1.6} color={PALETTE.ivory} position={[s * 8, 2.5, -4]} rotation-y={(-s * Math.PI) / 2} scale={[24, 3, 1]} />
      ))}
      {/* 뒤쪽 포털의 빛 */}
      <Lightformer form="rect" intensity={2.2} color={PALETTE.warmLight} position={[0, 3, HALL.backZ - 2]} scale={[5, 6, 1]} />
      {/* 앞쪽에서 오는 부드러운 반사광 */}
      <Lightformer form="rect" intensity={1.2} color={PALETTE.ivory} position={[0, 3, 10]} rotation-y={Math.PI} scale={[12, 5, 1]} />
      {/* 아주 옅은 라벤더 반사 — 금속에 은은한 색 변화를 줍니다 */}
      <Lightformer form="ring" intensity={0.8} color={PALETTE.lavender} position={[-4, 1, 3]} scale={3} />
    </Environment>
  )
}

export function Lighting({ quality }: { quality: 'high' | 'low' }) {
  const high = quality === 'high'
  return (
    <>
      <hemisphereLight args={['#fff6ea', PALETTE.lavenderMist, 0.38]} />
      <ambientLight intensity={0.06} color={PALETTE.warmLight} />
      <KeyLight mapSize={high ? 2048 : 1024} />
      {PEDESTALS.map(({ position }, i) => (
        <PedestalSpot key={i} position={position} castShadow={high} />
      ))}
      {/* 포털 안쪽에서 번져 나오는 따뜻한 빛 */}
      <pointLight position={[0, 3.2, HALL.backZ - 2.5]} intensity={28} distance={18} decay={2} color={PALETTE.warmLight} />
      <StudioEnvironment />
    </>
  )
}
