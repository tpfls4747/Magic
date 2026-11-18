import { Environment, Lightformer } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { DESK } from './layout'

/**
 * 따뜻한 시네마틱 조명.
 * - 왼쪽 위 창가에서 들어오는 주광: 소품의 형태와 부드러운 긴 그림자
 * - 뒤쪽 아치 창의 라벤더빛 역광: 물체 윤곽을 살짝 띄움
 * - 데스크 램프(Props.tsx)의 따뜻한 스포트라이트: 다이어리 위 빛 웅덩이
 * - Lightformer 환경맵: 금속 · 래커 표면의 반사 (외부 HDRI 없음)
 */
export function DeskLighting({ quality }: { quality: 'high' | 'low' }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, DESK.top, 0)
    return o
  }, [])
  const map = quality === 'high' ? 2048 : 1024

  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={['#fff4e6', '#cbbfe6', 0.3]} />
      <directionalLight
        position={[-1.7, 2.9, 1.5]}
        target={target}
        color="#fff0dc"
        intensity={1.75}
        castShadow
        shadow-mapSize={[map, map]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
        shadow-radius={4}
        shadow-camera-left={-1.1}
        shadow-camera-right={1.1}
        shadow-camera-top={1.1}
        shadow-camera-bottom={-1.1}
        shadow-camera-near={0.5}
        shadow-camera-far={7}
      />
      {/* 뒤쪽 창의 라벤더 역광 */}
      <directionalLight position={[0.9, 2.2, -2.2]} target={target} color="#d9ccf2" intensity={0.75} />
      <Environment resolution={256} frames={1} environmentIntensity={0.42}>
        <color attach="background" args={['#e6dacb']} />
        <Lightformer form="rect" intensity={2.2} color="#fff3e2" position={[-2, 3, 2]} rotation-y={-Math.PI / 4} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#e4dbf4" position={[0, 2, -3]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#fff8ec" position={[2.2, 1.6, 1.2]} rotation-y={-Math.PI * 0.7} scale={[0.5, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fffaf2" position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#f6efe6" position={[0, 1, 4]} rotation-y={Math.PI} scale={[6, 2, 1]} />
      </Environment>
    </>
  )
}
