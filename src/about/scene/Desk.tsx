import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createSlabGeometry } from './diaryGeometry'
import { DESK } from './layout'
import { deskBody, deskTop, gold, goldBright } from './materials'
import { verticalGradient } from './textures'

const { width: W, depth: D, thickness: T, top: TOP, apron: AP, legHeight: LH } = DESK

/** 아래로 갈수록 가늘어지는 우아한 책상 다리 + 금색 발굽 */
function Leg({ x, z }: { x: number; z: number }) {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const steps = 12
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      // 위는 굵고 아래로 완만하게 가늘어짐
      pts.push(new THREE.Vector2(0.024 - 0.011 * Math.pow(t, 1.4), LH * (1 - t)))
    }
    return pts
  }, [])
  const geom = useMemo(() => new THREE.LatheGeometry(profile, 24), [profile])
  useEffect(() => () => geom.dispose(), [geom])
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geom} position={[0, 0.03, 0]} material={deskBody()} castShadow receiveShadow />
      {/* 금색 발굽 */}
      <mesh position={[0, 0.016, 0]} material={gold()} castShadow>
        <cylinderGeometry args={[0.0135, 0.015, 0.032, 24]} />
      </mesh>
      {/* 다리 위 금색 고리 */}
      <mesh position={[0, LH + 0.012, 0]} material={gold()}>
        <cylinderGeometry args={[0.026, 0.026, 0.006, 24]} />
      </mesh>
    </group>
  )
}

/** 아이보리 래커 상판 + 금색 상감선 + 서랍이 있는 앞판 */
export function Desk() {
  const slab = useMemo(() => createSlabGeometry(W, D, T, 0.035, 0.008), [])
  useEffect(() => () => slab.dispose(), [slab])
  const legX = W / 2 - 0.08
  const legZ = D / 2 - 0.08

  return (
    <group>
      {/* 상판 */}
      <mesh geometry={slab} position={[0, TOP - T, 0]} material={deskTop()} castShadow receiveShadow />
      {/* 상판 앞 모서리 금색 상감선 */}
      <mesh position={[0, TOP - T * 0.5, D / 2 + 0.0005]} material={goldBright()}>
        <boxGeometry args={[W - 0.06, 0.0035, 0.002]} />
      </mesh>
      {/* 앞판 (서랍) */}
      <group position={[0, TOP - T - AP / 2, 0]}>
        <mesh material={deskBody()} castShadow receiveShadow>
          <boxGeometry args={[W - 0.12, AP, D - 0.12]} />
        </mesh>
        {/* 서랍 두 칸의 금색 테두리 + 손잡이 */}
        {[-0.34, 0.34].map((x) => (
          <group key={x} position={[x, 0, (D - 0.12) / 2 + 0.001]}>
            <mesh material={gold()}>
              <boxGeometry args={[0.5, 0.003, 0.002]} />
            </mesh>
            <mesh position={[0, -0.05, 0]} material={gold()}>
              <boxGeometry args={[0.5, 0.003, 0.002]} />
            </mesh>
            <mesh position={[0, -0.006, 0.006]} rotation={[0, 0, Math.PI / 2]} material={gold()} castShadow>
              <capsuleGeometry args={[0.0045, 0.05, 4, 12]} />
            </mesh>
          </group>
        ))}
      </group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Leg key={`${sx}${sz}`} x={sx * legX} z={sz * legZ} />))}
    </group>
  )
}

/**
 * 아틀리에 방 — 바닥, 아치 창이 있는 뒷벽.
 * 전시관과 같은 크림 미장 벽 · 라벤더빛 창으로 같은 세계에 속한 공간처럼 보이게 합니다.
 */
export function Room() {
  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#000000',
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: verticalGradient([
          [0, '#f3e6d4'],
          [0.25, '#efe2e2'],
          [0.6, '#d9cdef'],
          [1, '#c3b4e0'],
        ]),
        emissiveIntensity: 0.95,
        roughness: 1,
      }),
    [],
  )
  const arch = useMemo(() => {
    const w = 1.1
    const h = 2.3
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h - w / 2)
    s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false)
    s.lineTo(-w / 2, 0)
    return new THREE.ShapeGeometry(s, 32)
  }, [])
  // 창 테두리 몰딩 (아치 모양 링)
  const archFrame = useMemo(() => {
    const w = 1.22
    const h = 2.36
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h - w / 2)
    s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false)
    s.lineTo(-w / 2, 0)
    const inner = new THREE.Path()
    const iw = 1.1
    const ih = 2.3
    inner.moveTo(-iw / 2, 0)
    inner.lineTo(-iw / 2, ih - iw / 2)
    inner.absarc(0, ih - iw / 2, iw / 2, Math.PI, 0, true)
    inner.lineTo(iw / 2, 0)
    inner.lineTo(-iw / 2, 0)
    s.holes.push(inner)
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 32 })
  }, [])
  useEffect(
    () => () => {
      windowMat.dispose()
      arch.dispose()
      archFrame.dispose()
    },
    [windowMat, arch, archFrame],
  )

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#e7dccb" roughness={0.75} envMapIntensity={0.5} />
      </mesh>
      {/* 뒷벽 */}
      <mesh position={[0, 2, -1.5]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#e6dac7" roughness={0.92} envMapIntensity={0.6} />
      </mesh>
      {/* 아치 창 두 개 — 책상 양쪽 뒤로 */}
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 0.55, -1.49]}>
          <mesh geometry={arch} material={windowMat} />
          <mesh geometry={archFrame} position={[0, -0.03, -0.02]}>
            <meshStandardMaterial color="#f2eadc" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* 창 아래 걸레받이 몰딩 */}
      <mesh position={[0, 0.05, -1.47]} receiveShadow>
        <boxGeometry args={[12, 0.1, 0.04]} />
        <meshStandardMaterial color="#efe6d8" roughness={0.6} />
      </mesh>
    </group>
  )
}
