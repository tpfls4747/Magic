import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { archBandShape, archPath3, gemGeometry, wallShape } from './geometry'
import { DOOR, DOOR_TOP, WALL_FRONT_Z } from './layout'
import type { DoorMaterials } from './materials'

const BANDS: [number, number][] = [
  // [폭, 돌출] — 안쪽부터. The Floating Atelier 아치처럼 계단형으로 물러남
  [0.11, 0.1],
  [0.09, 0.16],
  [0.16, 0.07],
]

/** 벽 · 계단형 아치 몰딩 · 금 테두리 · 키스톤 · 기둥 · 바닥 */
export function ArchDoorway({ materials, shadows }: { materials: DoorMaterials; shadows: boolean }) {
  const { halfWidth: H, spring, wallDepth } = DOOR

  const geo = useMemo(() => {
    const wall = new THREE.ExtrudeGeometry(wallShape(7, 11, H, spring), {
      depth: wallDepth,
      bevelEnabled: false,
      curveSegments: 96,
    })
    wall.translate(0, 0, -wallDepth / 2)

    const bands = BANDS.map(([w, d], i) => {
      const inner = H + BANDS.slice(0, i).reduce((sum, [bw]) => sum + bw, 0)
      const g = new THREE.ExtrudeGeometry(archBandShape(inner, w, spring, 0.16), {
        depth: d,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 3,
        curveSegments: 96,
      })
      g.translate(0, 0, WALL_FRONT_Z)
      return g
    })
    const frameOuter = H + BANDS.reduce((sum, [bw]) => sum + bw, 0)

    // 금 테두리 — 개구부 안쪽 가장자리와 몰딩 사이
    const trim = new THREE.TubeGeometry(archPath3(H + 0.11, spring, WALL_FRONT_Z + 0.105, 0.16), 240, 0.014, 10, false)
    const trimOuter = new THREE.TubeGeometry(archPath3(frameOuter + 0.01, spring, WALL_FRONT_Z + 0.075, 0.16), 260, 0.009, 8, false)

    // 받침(플린스) — 몰딩 다리 아래
    const plinth = new THREE.BoxGeometry(frameOuter - H + 0.06, 0.16, 0.24)

    // 아치 시작점의 임포스트 블록
    const impost = new THREE.BoxGeometry(frameOuter - H + 0.1, 0.1, 0.26)

    // 키스톤 (사다리꼴)
    const ks = new THREE.Shape()
    ks.moveTo(-0.13, 0)
    ks.lineTo(0.13, 0)
    ks.lineTo(0.19, 0.5)
    ks.lineTo(-0.19, 0.5)
    ks.lineTo(-0.13, 0)
    const keystone = new THREE.ExtrudeGeometry(ks, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 })
    keystone.translate(0, DOOR_TOP - 0.06, WALL_FRONT_Z)
    const medallion = new THREE.TorusGeometry(0.075, 0.012, 10, 40)
    const gem = gemGeometry(0.06, 1.15)

    // 측면 기둥(필라스터) + 주두
    const pilaster = new THREE.BoxGeometry(0.34, 10, 0.12)
    pilaster.translate(0, 5, WALL_FRONT_Z + 0.06)
    const base = new THREE.BoxGeometry(0.44, 0.2, 0.18)
    base.translate(0, 0.1, WALL_FRONT_Z + 0.09)
    const fluteLine = new THREE.BoxGeometry(0.012, 9.4, 0.01)

    // 걸레받이
    const skirting = new THREE.BoxGeometry(14, 0.16, 0.05)
    skirting.translate(0, 0.08, WALL_FRONT_Z + 0.025)

    const floor = new THREE.PlaneGeometry(40, 30)
    floor.rotateX(-Math.PI / 2)
    floor.translate(0, 0, 10)
    // 문턱
    const threshold = new THREE.BoxGeometry(H * 2 + 0.1, 0.03, wallDepth + 0.04)
    threshold.translate(0, 0.015, 0)

    return {
      wall,
      bands,
      trim,
      trimOuter,
      plinth,
      impost,
      keystone,
      medallion,
      gem,
      pilaster,
      base,
      fluteLine,
      skirting,
      floor,
      threshold,
      frameOuter,
    }
  }, [H, spring, wallDepth])

  useLayoutEffect(
    () => () => {
      Object.values(geo).forEach((g) => {
        if (Array.isArray(g)) g.forEach((x) => x.dispose())
        else if (g instanceof THREE.BufferGeometry) g.dispose()
      })
    },
    [geo],
  )

  const m = materials
  const legX = (H + geo.frameOuter) / 2
  const pilasterX = geo.frameOuter + 1.75

  return (
    <group>
      <mesh geometry={geo.wall} material={m.plaster} receiveShadow />
      {geo.bands.map((g, i) => (
        <mesh key={i} geometry={g} material={m.stone} castShadow={shadows} receiveShadow />
      ))}
      <mesh geometry={geo.trim} material={m.gold} />
      <mesh geometry={geo.trimOuter} material={m.goldDeep} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={geo.plinth} material={m.stone} position={[s * legX, 0.08, WALL_FRONT_Z + 0.12]} castShadow={shadows} />
          <mesh geometry={geo.impost} material={m.stone} position={[s * legX, spring, WALL_FRONT_Z + 0.13]} castShadow={shadows} />
          <mesh position={[s * legX, spring - 0.055, WALL_FRONT_Z + 0.262]}>
            <boxGeometry args={[geo.frameOuter - H + 0.1, 0.012, 0.01]} />
            <primitive object={m.gold} attach="material" />
          </mesh>
          <group position={[s * pilasterX, 0, 0]}>
            <mesh geometry={geo.pilaster} material={m.stone} castShadow={shadows} receiveShadow />
            <mesh geometry={geo.base} material={m.stone} />
            {[-0.09, 0, 0.09].map((x) => (
              <mesh key={x} geometry={geo.fluteLine} material={m.molding} position={[x, 5.1, WALL_FRONT_Z + 0.123]} />
            ))}
          </group>
        </group>
      ))}
      <mesh geometry={geo.keystone} material={m.stone} castShadow={shadows} />
      <group position={[0, DOOR_TOP + 0.2, WALL_FRONT_Z + 0.27]}>
        <mesh geometry={geo.medallion} material={m.gold} scale={[1, 1.18, 1]} />
        <mesh geometry={geo.gem} material={m.gem} />
      </group>
      <mesh geometry={geo.skirting} material={m.stone} receiveShadow />
      <mesh geometry={geo.floor} material={m.floor} receiveShadow />
      <mesh geometry={geo.threshold} material={m.stone} receiveShadow />
    </group>
  )
}
