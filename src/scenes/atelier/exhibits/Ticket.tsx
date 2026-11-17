import { forwardRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { goldTrimMaterial } from '../materials'
import { createTicketArt, PERF_X, TICKET, type TicketInfo } from './ticketArt'

const { width: W, height: H, notchRadius: N, cornerRadius: R, depth: D, bevel: B } = TICKET

/** 앞면 표면의 z (베벨 포함) */
const FACE_Z = D / 2 + B

/**
 * 티켓 외곽선 — 둥근 모서리 + 절취선 위아래의 반원 노치
 */
function ticketShape() {
  const s = new THREE.Shape()
  const l = -W / 2
  const r = W / 2
  const b = -H / 2
  const t = H / 2
  s.moveTo(l + R, b)
  s.lineTo(PERF_X - N, b)
  s.absarc(PERF_X, b, N, Math.PI, 0, true) // 아래 노치 (안쪽으로 파임)
  s.lineTo(r - R, b)
  s.absarc(r - R, b + R, R, -Math.PI / 2, 0, false)
  s.lineTo(r, t - R)
  s.absarc(r - R, t - R, R, 0, Math.PI / 2, false)
  s.lineTo(PERF_X + N, t)
  s.absarc(PERF_X, t, N, 0, Math.PI, true) // 위 노치
  s.lineTo(l + R, t)
  s.absarc(l + R, t - R, R, Math.PI / 2, Math.PI, false)
  s.lineTo(l, b + R)
  s.absarc(l + R, b + R, R, Math.PI, Math.PI * 1.5, false)
  return s
}

function roundedRectPath<T extends THREE.Path>(
  path: T,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  clockwise = false,
): T {
  if (!clockwise) {
    path.moveTo(x0 + r, y0)
    path.lineTo(x1 - r, y0)
    path.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false)
    path.lineTo(x1, y1 - r)
    path.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false)
    path.lineTo(x0 + r, y1)
    path.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false)
    path.lineTo(x0, y0 + r)
    path.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false)
  } else {
    path.moveTo(x0 + r, y0)
    path.absarc(x0 + r, y0 + r, r, Math.PI * 1.5, Math.PI, true)
    path.lineTo(x0, y1 - r)
    path.absarc(x0 + r, y1 - r, r, Math.PI, Math.PI / 2, true)
    path.lineTo(x1 - r, y1)
    path.absarc(x1 - r, y1 - r, r, Math.PI / 2, 0, true)
    path.lineTo(x1, y0 + r)
    path.absarc(x1 - r, y0 + r, r, 0, -Math.PI / 2, true)
    path.lineTo(x0 + r, y0)
  }
  return path
}

/** 가는 금박 테두리 띠 (둥근 사각 링) */
function frameShape(x0: number, y0: number, x1: number, y1: number, band: number, r: number) {
  const outer = roundedRectPath(new THREE.Shape(), x0, y0, x1, y1, r)
  outer.holes.push(
    roundedRectPath(new THREE.Path(), x0 + band, y0 + band, x1 - band, y1 - band, r - band * 0.6, true),
  )
  return outer
}

/** 두 티켓이 공유하는 지오메트리 — 한 번만 생성 */
let sharedGeometry: ReturnType<typeof buildGeometry> | null = null

function buildGeometry() {
  const body = new THREE.ExtrudeGeometry(ticketShape(), {
    depth: D,
    bevelEnabled: true,
    bevelThickness: B,
    bevelSize: B,
    bevelSegments: 3,
    curveSegments: 28,
  })
  body.translate(0, 0, -D / 2)

  const inset = 0.022
  const band = 0.0032
  const frameDepth = 0.0007
  const frameOpts = { depth: frameDepth, bevelEnabled: false, curveSegments: 10 }
  const mainFrame = new THREE.ExtrudeGeometry(
    frameShape(-W / 2 + inset, -H / 2 + inset, PERF_X - 0.035, H / 2 - inset, band, 0.012),
    frameOpts,
  )
  const stubFrame = new THREE.ExtrudeGeometry(
    frameShape(PERF_X + 0.035, -H / 2 + inset, W / 2 - inset, H / 2 - inset, band, 0.012),
    frameOpts,
  )

  // 금박 인장 — 테두리가 도드라진 작은 코인
  const seal = new THREE.LatheGeometry(
    // 바깥 가장자리(아래) → 도드라진 테 → 살짝 오목한 안쪽 → 중심(위) 순서
    [
      new THREE.Vector2(0.0196, 0),
      new THREE.Vector2(0.019, 0.0018),
      new THREE.Vector2(0.0165, 0.0024),
      new THREE.Vector2(0.014, 0.0012),
      new THREE.Vector2(0.012, 0.0016),
      new THREE.Vector2(0, 0.0016),
    ],
    48,
  )
  seal.rotateX(Math.PI / 2)

  const face = new THREE.PlaneGeometry(W, H)
  return { body, mainFrame, stubFrame, seal, face }
}

function getGeometry() {
  sharedGeometry ??= buildGeometry()
  return sharedGeometry
}

/** 코팅된 아이보리 카드지 */
const paperMaterial = new THREE.MeshPhysicalMaterial({
  color: '#f6efe3',
  roughness: 0.58,
  metalness: 0,
  clearcoat: 0.25,
  clearcoatRoughness: 0.35,
  sheen: 0.4,
  sheenRoughness: 0.6,
  sheenColor: new THREE.Color('#efe6f6'),
  envMapIntensity: 0.9,
})

/** 금박 (표면에 찍힌 얇은 포일) */
const foilMaterialBase = {
  color: new THREE.Color('#d9bb82'),
  metalness: 1,
  roughness: 0.26,
  envMapIntensity: 1.6,
}

/** 인장 위치 (본문 영역 오른쪽 위) */
const SEAL_POS: [number, number] = [0.083, 0.068]

export interface TicketProps {
  info: TicketInfo
  castShadow?: boolean
}

/**
 * 공연 티켓 한 장 — 실제 두께와 금박 모서리를 가진 입체 카드.
 * 앞면: 잉크 인쇄 + 금박 제목·이중 테두리 + 금박 인장, 뒷면: 라벤더 지문 무늬
 */
export const Ticket = forwardRef<THREE.Group, TicketProps>(function Ticket(
  { info, castShadow = true },
  ref,
) {
  const geo = getGeometry()
  const art = useMemo(() => createTicketArt(info), [info])
  useEffect(() => () => art.dispose(), [art])

  const materials = useMemo(() => {
    const ink = new THREE.MeshStandardMaterial({
      map: art.ink,
      transparent: true,
      roughness: 0.7,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    const foil = new THREE.MeshStandardMaterial({
      ...foilMaterialBase,
      alphaMap: art.foil,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
    const back = new THREE.MeshStandardMaterial({
      map: art.back,
      transparent: true,
      roughness: 0.7,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    return { ink, foil, back }
  }, [art])
  useEffect(
    () => () => {
      materials.ink.dispose()
      materials.foil.dispose()
      materials.back.dispose()
    },
    [materials],
  )

  return (
    <group ref={ref}>
      {/* 카드 본체: 면은 아이보리, 옆면(두께)은 금박 처리한 모서리 */}
      <mesh
        geometry={geo.body}
        material={[paperMaterial, goldTrimMaterial]}
        castShadow={castShadow}
        receiveShadow
      />

      {/* 앞면 */}
      <mesh geometry={geo.face} material={materials.ink} position-z={FACE_Z + 0.0003} />
      <mesh geometry={geo.face} material={materials.foil} position-z={FACE_Z + 0.0005} />
      <mesh geometry={geo.mainFrame} material={goldTrimMaterial} position-z={FACE_Z} />
      <mesh geometry={geo.stubFrame} material={goldTrimMaterial} position-z={FACE_Z} />
      <mesh
        geometry={geo.seal}
        material={goldTrimMaterial}
        position={[SEAL_POS[0], SEAL_POS[1], FACE_Z]}
        castShadow={false}
      />

      {/* 뒷면 */}
      <mesh
        geometry={geo.face}
        material={materials.back}
        position-z={-FACE_Z - 0.0003}
        rotation-y={Math.PI}
      />
    </group>
  )
})
