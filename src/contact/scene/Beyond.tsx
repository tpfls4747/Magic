import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { doorClock, type DoorAnim } from '../animState'
import { archOpeningShape } from './geometry'
import { DOOR, DOOR_TOP, LEAF_FRONT_Z, WALL_FRONT_Z } from './layout'
import { beyondTexture, seamTexture, spillTexture } from './textures'

/**
 * 문 너머의 세계와 새어 나오는 빛.
 *  - 닫힘: 문틈 뒤의 라벤더 빛 면 + 문 앞 세로 빛줄기 + 문턱 아래 가는 빛
 *  - 열림: 문 너머 아이보리·라벤더 하늘이 밝아지고, 바닥에 빛이 길게 드리우며,
 *          문 뒤 스포트라이트가 열린 문짝의 그림자를 앞쪽 바닥에 떨어뜨림
 */
export function Beyond({ anim, shadows }: { anim: DoorAnim; shadows: boolean }) {
  const res = useMemo(() => {
    const sky = beyondTexture()
    const seam = seamTexture()
    const spill = spillTexture()
    const leakGeo = new THREE.ShapeGeometry(archOpeningShape(DOOR.halfWidth - 0.002, DOOR.spring), 48)
    const skyMat = new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })
    const leakMat = new THREE.MeshBasicMaterial({ color: '#e4d6ff', toneMapped: false, transparent: true, depthWrite: false })
    const groundMat = new THREE.MeshBasicMaterial({ color: '#f6ecdc', toneMapped: false, transparent: true, map: spill })
    const seamMat = new THREE.MeshBasicMaterial({
      map: seam,
      color: '#ae97ea',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const sillMat = new THREE.MeshBasicMaterial({
      map: spill,
      color: '#c3b0f2',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const spillMat = new THREE.MeshBasicMaterial({
      map: spill,
      color: '#fff0d6',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { sky, seam, spill, leakGeo, skyMat, leakMat, groundMat, seamMat, sillMat, spillMat }
  }, [])

  useLayoutEffect(
    () => () => {
      const r = res
      ;[r.sky, r.seam, r.spill, r.leakGeo, r.skyMat, r.leakMat, r.groundMat, r.seamMat, r.sillMat, r.spillMat].forEach((x) =>
        x.dispose(),
      )
    },
    [res],
  )

  const spot = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const t = doorClock.time
    const L = anim.light
    const breathe = 0.5 + Math.sin(t * 1.1) * 0.5
    // 닫혀 있을 때의 은은한 문틈 빛 (hover 시 밝아짐), 문이 열리면 자연스럽게 사라짐
    const gap = (0.55 + breathe * 0.15 + anim.hover * 0.45) * (1 - Math.min(1, anim.leaf * 2.5))
    res.seamMat.opacity = 0.32 * gap
    res.sillMat.opacity = 0.42 * gap
    const k = 0.62 + 0.38 * L
    res.skyMat.color.setScalar(k)
    res.leakMat.color.set('#e4d6ff').multiplyScalar(0.92 + anim.hover * 0.08)
    // 문이 열리기 시작하면 사라져 문 너머 세계가 드러남
    res.leakMat.opacity = 1 - Math.min(1, anim.leaf * 4)
    res.groundMat.opacity = 0.35 + 0.6 * L
    res.spillMat.opacity = 0.55 * L
    if (spot.current) spot.current.intensity = L * 38
  })

  const leakZ = LEAF_FRONT_Z - DOOR.leafThickness - 0.03

  return (
    <group>
      {/* 문 너머 하늘 */}
      <mesh position={[0, 3.2, -6]} material={res.skyMat}>
        <planeGeometry args={[18, 11]} />
      </mesh>
      {/* 문 너머 바닥 — 빛으로 이어지는 길 */}
      <mesh position={[0, 0.002, -3.2]} rotation={[-Math.PI / 2, 0, Math.PI]} material={res.groundMat}>
        <planeGeometry args={[3.2, 5.8]} />
      </mesh>
      {/* 문짝 바로 뒤의 라벤더 빛 면 — 문틈으로만 보임 */}
      <mesh geometry={res.leakGeo} material={res.leakMat} position={[0, 0, leakZ]} />
      {/* 문 앞 세로 빛줄기 (가운데 틈) */}
      <mesh position={[0, DOOR_TOP / 2, LEAF_FRONT_Z + 0.004]} material={res.seamMat} renderOrder={2}>
        <planeGeometry args={[0.34, DOOR_TOP - 0.05]} />
      </mesh>
      {/* 문턱 앞 바닥에 번지는 가는 빛 */}
      <mesh position={[0, 0.004, WALL_FRONT_Z + 0.35]} rotation={[-Math.PI / 2, 0, 0]} material={res.sillMat} renderOrder={2}>
        <planeGeometry args={[2.4, 0.8]} />
      </mesh>
      {/* 열린 뒤 바닥에 길게 드리우는 빛 */}
      <mesh position={[0, 0.005, WALL_FRONT_Z + 2.2]} rotation={[-Math.PI / 2, 0, 0]} material={res.spillMat} renderOrder={3}>
        <planeGeometry args={[3.2, 4.4]} />
      </mesh>

      <primitive object={target} position={[0, 0, 4]} />
      <spotLight
        ref={spot}
        position={[0, 2.3, -3.4]}
        target={target}
        angle={0.62}
        penumbra={0.75}
        decay={1.6}
        distance={16}
        intensity={0}
        color="#fff1dc"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </group>
  )
}
