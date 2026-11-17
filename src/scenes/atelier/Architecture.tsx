import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, HALL_CENTER_Z, HALL_LENGTH } from './constants'
import {
  ArchCurve,
  archedWallShape,
  archivoltShape,
  columnProfile,
  corniceShape,
} from './geometry'
import {
  glowWallMaterial,
  goldTrimMaterial,
  ivoryMaterial,
  nicheMaterial,
  plasterMaterial,
  skylightMaterial,
  stoneMaterial,
} from './materials'

const WALL_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  bevelEnabled: true,
  bevelSize: 0.015,
  bevelThickness: 0.015,
  bevelSegments: 2,
  curveSegments: 64,
}

function extrude(shape: THREE.Shape, depth: number, options = WALL_EXTRUDE) {
  return new THREE.ExtrudeGeometry(shape, { ...options, depth })
}

/** 아치를 감싸는 계단형 몰딩 + 안쪽 금색 트림 */
function ArchFrame({
  radius,
  spring,
  bands,
  trimDepth,
}: {
  radius: number
  spring: number
  /** [띠 폭, 돌출 깊이] — 안쪽부터 */
  bands: [number, number][]
  trimDepth: number
}) {
  const geometries = useMemo(
    () =>
      bands.map(([band, depth], i) => {
        // 안쪽 띠들의 폭을 더해 이 띠의 안쪽 반지름을 구합니다.
        const inner = radius + bands.slice(0, i).reduce((sum, [w]) => sum + w, 0)
        const g = extrude(archivoltShape(inner, band, spring), depth, {
          ...WALL_EXTRUDE,
          bevelSize: 0.012,
          bevelThickness: 0.012,
        })
        return { g, depth }
      }),
    [radius, spring, bands],
  )

  const trim = useMemo(
    () => new THREE.TubeGeometry(new ArchCurve(radius + 0.01, spring), 220, 0.02, 10, false),
    [radius, spring],
  )

  return (
    <group>
      {geometries.map(({ g }, i) => (
        <mesh key={i} geometry={g} material={ivoryMaterial} receiveShadow />
      ))}
      <mesh geometry={trim} material={goldTrimMaterial} position-z={trimDepth} />
    </group>
  )
}

/** 측면 아케이드 벽 — 7개의 아치가 리듬감 있게 반복 */
function SideWall({ side }: { side: -1 | 1 }) {
  const { width, spring } = HALL.sideArch
  const openings = useMemo(
    () => HALL.sideArchCenters.map((z) => ({ x: z - HALL_CENTER_Z, width, spring })),
    [width, spring],
  )
  const wall = useMemo(
    () => extrude(archedWallShape(HALL_LENGTH, HALL.springHeight, openings), HALL.wallDepth),
    [openings],
  )

  const bandDepth = 0.07
  return (
    <group
      position={[side * HALL.halfWidth, 0, HALL_CENTER_Z]}
      rotation-y={(side * Math.PI) / 2}
    >
      <mesh geometry={wall} material={plasterMaterial} receiveShadow />
      {openings.map((o) => (
        <group key={o.x} position={[o.x, 0, -bandDepth]}>
          <ArchFrame
            radius={width / 2}
            spring={spring}
            bands={[[0.14, bandDepth]]}
            trimDepth={-0.005}
          />
        </group>
      ))}
    </group>
  )
}

/** 벽에 반쯤 묻힌 고전 기둥과 그 위에서 시작하는 천장 리브 */
function ColumnsAndRibs() {
  const columnGeo = useMemo(
    () => new THREE.LatheGeometry(columnProfile(HALL.springHeight), 64),
    [],
  )
  const ribGeo = useMemo(
    () => new THREE.TorusGeometry(HALL.columnX, 0.11, 20, 160, Math.PI),
    [],
  )
  const ribLineGeo = useMemo(
    () => new THREE.TorusGeometry(HALL.columnX - 0.12, 0.012, 8, 160, Math.PI),
    [],
  )

  return (
    <group>
      {HALL.columnZ.map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={columnGeo}
              material={stoneMaterial}
              position={[side * HALL.columnX, 0, z]}
              castShadow
              receiveShadow
            />
          ))}
          <mesh geometry={ribGeo} material={ivoryMaterial} position={[0, HALL.springHeight, z]} />
          <mesh
            geometry={ribLineGeo}
            material={goldTrimMaterial}
            position={[0, HALL.springHeight, z]}
          />
        </group>
      ))}
    </group>
  )
}

/** 원통형 볼트 천장 + 꼭대기의 가느다란 채광창 */
function Vault() {
  const r = HALL.halfWidth
  const vaultGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(r, r, HALL_LENGTH, 96, 1, true, Math.PI / 2, Math.PI)
    g.rotateX(Math.PI / 2)
    return g
  }, [r])

  return (
    <group position={[0, HALL.springHeight, HALL_CENTER_Z]}>
      <mesh geometry={vaultGeo}>
        {/* 천장은 아래를 향해 어두워지기 쉬워, 라벤더빛이 아주 옅게 감도는 자체 발광으로 공기감을 줍니다 */}
        <meshStandardMaterial
          color={plasterMaterial.color}
          roughness={0.95}
          emissive="#c9bde4"
          emissiveIntensity={0.2}
          envMapIntensity={0.9}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh position-y={r - 0.04} rotation-x={Math.PI / 2} material={skylightMaterial}>
        <planeGeometry args={[0.7, HALL_LENGTH]} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, r - 0.05, 0]} rotation-x={Math.PI / 2} material={goldTrimMaterial}>
          <cylinderGeometry args={[0.012, 0.012, HALL_LENGTH, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** 벽 상단 코니스 */
function Cornices() {
  const shape = useMemo(() => corniceShape(), [])
  const sideGeo = useMemo(
    () => extrude(shape, HALL_LENGTH, { bevelEnabled: false, curveSegments: 12 }),
    [shape],
  )
  // 뒤쪽 벽은 포털 양옆으로만 (포털을 가로지르지 않도록)
  const backSegment = HALL.halfWidth - 2.95
  const backGeo = useMemo(
    () => extrude(shape, backSegment, { bevelEnabled: false, curveSegments: 12 }),
    [shape, backSegment],
  )

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={sideGeo}
          material={ivoryMaterial}
          position={[side * HALL.halfWidth, HALL.springHeight, HALL.backZ]}
          scale-x={-side}
        />
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`b${side}`}
          geometry={backGeo}
          material={ivoryMaterial}
          position={[side * HALL.halfWidth, HALL.springHeight, HALL.backZ]}
          rotation-y={-Math.PI / 2}
          scale-z={side}
        />
      ))}
    </group>
  )
}

/** 뒤쪽 벽 — 대형 아치 포털, 양옆 니치, 루네트의 원형 창(오큘러스) */
const BACK_DEPTH = 0.6
const PORTAL = { x: 0, width: 4.4, spring: 4.2 }
const NICHES = [-3.85, 3.85].map((x) => ({ x, width: 1.5, spring: 2.5 }))
const OCULUS = { y: 8.75, r: 0.85 }

function BackWall() {
  const depth = BACK_DEPTH
  const portal = PORTAL
  const niches = NICHES
  const oculus = OCULUS

  const wall = useMemo(() => {
    const shape = archedWallShape(HALL.halfWidth * 2, HALL.springHeight, [portal, ...niches], {
      type: 'lunette',
      radius: HALL.halfWidth,
    })
    const hole = new THREE.Path()
    hole.absarc(0, oculus.y, oculus.r, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    return extrude(shape, depth)
  }, [depth, portal, niches, oculus])

  const oculusRing = useMemo(
    () => new THREE.TorusGeometry(oculus.r + 0.05, 0.05, 16, 96),
    [oculus.r],
  )
  const oculusTrim = useMemo(
    () => new THREE.TorusGeometry(oculus.r + 0.005, 0.018, 8, 96),
    [oculus.r],
  )

  return (
    <group position-z={HALL.backZ}>
      <mesh geometry={wall} material={plasterMaterial} position-z={-depth} receiveShadow />

      {/* 대형 포털: 3단 계단형 아키볼트 */}
      <ArchFrame
        radius={portal.width / 2}
        spring={portal.spring}
        bands={[
          [0.16, 0.2],
          [0.16, 0.13],
          [0.14, 0.07],
        ]}
        trimDepth={0.215}
      />

      {/* 니치: 안쪽은 라벤더 기운이 도는 패널 */}
      {niches.map((n) => (
        <group key={n.x} position-x={n.x}>
          <ArchFrame
            radius={n.width / 2}
            spring={n.spring}
            bands={[[0.12, 0.08]]}
            trimDepth={0.09}
          />
          <mesh position={[0, 1.7, -0.42]} material={nicheMaterial}>
            <planeGeometry args={[1.8, 3.6]} />
          </mesh>
        </group>
      ))}

      {/* 오큘러스 */}
      <mesh geometry={oculusRing} material={ivoryMaterial} position={[0, oculus.y, 0.04]} />
      <mesh geometry={oculusTrim} material={goldTrimMaterial} position={[0, oculus.y, 0.1]} />
    </group>
  )
}

/** 측면 아치 너머로 보이는 빛나는 외부 회랑 */
function OuterGallery() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * HALL.outerWallX, 4.5, HALL_CENTER_Z]}
          rotation-y={(-side * Math.PI) / 2}
          material={glowWallMaterial}
        >
          <planeGeometry args={[HALL_LENGTH, 9]} />
        </mesh>
      ))}
    </group>
  )
}

export function Architecture() {
  return (
    <group>
      <SideWall side={-1} />
      <SideWall side={1} />
      <ColumnsAndRibs />
      <Vault />
      <Cornices />
      <BackWall />
      <OuterGallery />
    </group>
  )
}
