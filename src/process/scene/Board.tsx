import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { roundedRect, slab } from './geometry'
import type { BoardLayout } from './layout'
import { boardEdge, boardSurface, gold, goldBright } from './materials'

/**
 * 대형 아이보리 디자인 보드.
 * 앞면이 z=0 에 오도록 놓이며, 두께 · 금색 테두리 · 아래 선반 · 금색 이젤 다리를 갖습니다.
 */
export function Board({ layout }: { layout: BoardLayout }) {
  const { width: W, height: H, thickness: T, centerY: CY } = layout

  const geoms = useMemo(() => {
    const body = slab(W, H, T, 0.05, 0.012)
    // 앞면 금색 테두리 (둥근 사각 링)
    const outer = roundedRect(W - 0.01, H - 0.01, 0.045)
    outer.holes.push(roundedRect(W - 0.07, H - 0.07, 0.03) as unknown as THREE.Path)
    const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.012, bevelEnabled: false, curveSegments: 8 })
    return { body, frame }
  }, [W, H, T])
  useEffect(
    () => () => {
      geoms.body.dispose()
      geoms.frame.dispose()
    },
    [geoms],
  )

  const bottom = CY - H / 2
  // 이젤 다리: 바닥에서 보드 뒤 위쪽까지 비스듬히
  const legs = useMemo(() => {
    const top = new THREE.Vector3(0, CY + H * 0.32, -T - 0.02)
    const foot = new THREE.Vector3(0, 0, -0.55)
    const dir = top.clone().sub(foot)
    const len = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    const mid = foot.clone().add(top).multiplyScalar(0.5)
    return { len, q, mid }
  }, [CY, H, T])

  return (
    <group>
      <mesh geometry={geoms.body} position={[0, CY, -T]} material={[boardSurface(), boardEdge()]} castShadow receiveShadow />
      <mesh geometry={geoms.frame} position={[0, CY, -0.006]} material={gold()} castShadow />
      {/* 아래 선반 */}
      <group position={[0, bottom + 0.02, 0.04]}>
        <mesh material={boardEdge()} castShadow receiveShadow>
          <boxGeometry args={[W - 0.12, 0.028, 0.1]} />
        </mesh>
        <mesh position={[0, 0.002, 0.051]} material={goldBright()}>
          <boxGeometry args={[W - 0.12, 0.006, 0.003]} />
        </mesh>
      </group>
      {/* 앞 다리 두 개 (보드를 받치는 금색 기둥) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.25), 0, 0.02]}>
          <mesh position={[0, bottom / 2, 0]} material={gold()} castShadow>
            <cylinderGeometry args={[0.012, 0.016, bottom, 16]} />
          </mesh>
          <mesh position={[0, 0.012, 0]} material={gold()} castShadow>
            <cylinderGeometry args={[0.03, 0.036, 0.024, 24]} />
          </mesh>
        </group>
      ))}
      {/* 뒤 이젤 다리 */}
      <mesh position={legs.mid} quaternion={legs.q} material={gold()} castShadow>
        <cylinderGeometry args={[0.011, 0.015, legs.len, 12]} />
      </mesh>
    </group>
  )
}

function gradientTexture(stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 256, 0, 0)
  for (const [at, col] of stops) g.addColorStop(at, col)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** 아틀리에 방 — 바닥, 크림 미장 벽, 라벤더빛 아치 창 (전시관과 같은 세계) */
export function Room({ layout }: { layout: BoardLayout }) {
  const res = useMemo(() => {
    const map = gradientTexture([
      [0, '#f3e6d4'],
      [0.25, '#efe2e2'],
      [0.6, '#d9cdef'],
      [1, '#c3b4e0'],
    ])
    const windowMat = new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: map,
      emissiveIntensity: 0.9,
      roughness: 1,
    })
    const w = 1.2
    const h = 3.1
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h - w / 2)
    s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false)
    s.lineTo(-w / 2, 0)
    const arch = new THREE.ShapeGeometry(s, 32)
    return { map, windowMat, arch }
  }, [])
  useEffect(
    () => () => {
      res.map.dispose()
      res.windowMat.dispose()
      res.arch.dispose()
    },
    [res],
  )
  const wx = layout.orientation === 'portrait' ? 1.55 : 2.75

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#e5dacb" roughness={0.8} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 2.6, -1.4]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#e4d8c5" roughness={0.92} envMapIntensity={0.6} />
      </mesh>
      {[-wx, wx].map((x) => (
        <mesh key={x} geometry={res.arch} material={res.windowMat} position={[x, 0.3, -1.39]} />
      ))}
      <mesh position={[0, 0.06, -1.38]}>
        <boxGeometry args={[16, 0.12, 0.04]} />
        <meshStandardMaterial color="#ede4d6" roughness={0.6} />
      </mesh>
    </group>
  )
}
