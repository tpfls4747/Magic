import * as THREE from 'three'

/**
 * 다이어리 지오메트리.
 *
 * 좌표계 (다이어리 그룹 로컬)
 *   x : 책등(0) → 바깥 모서리(+). 펼쳐진 왼쪽 페이지는 x < 0
 *   y : 위
 *   z : 페이지 세로 방향. 페이지 윗부분(글자 윗줄)이 -z (카메라에서 먼 쪽)
 */

/**
 * 한 장의 낱장 — 책등 쪽 한 변을 축으로 휘어지며 넘어가는 띠 형태 메시.
 * 폭 방향으로 segments 개로 나누고, bendLeaf() 가 매 프레임 정점을 다시 계산합니다.
 */
export function createLeafGeometry(width: number, height: number, segments: number) {
  const geom = new THREE.BufferGeometry()
  const count = (segments + 1) * 2
  const pos = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    // row 0: 가까운 쪽(z+, v=0) / row 1: 먼 쪽(z-, v=1)
    for (let r = 0; r < 2; r++) {
      const k = i * 2 + r
      pos[k * 3] = u * width
      pos[k * 3 + 2] = r === 0 ? height / 2 : -height / 2
      uv[k * 2] = u
      uv[k * 2 + 1] = r
    }
  }
  const index: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    // 앞면 법선이 +y 를 향하도록 감는 방향 지정
    index.push(a, c, b, c, d, b)
  }
  geom.setIndex(index)
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geom.computeVertexNormals()
  return geom
}

export interface LeafPose {
  /** 넘김 진행도 0 (오른쪽에 놓임) → 1 (왼쪽에 놓임) */
  t: number
  /** 오른쪽에 놓였을 때 책등 높이 */
  yRight: number
  /** 왼쪽에 놓였을 때 책등 높이 */
  yLeft: number
  /** 왼쪽에 놓였을 때 바깥쪽으로 내려가는 기울기 (rad) */
  slopeLeft: number
  /** 넘기는 중 종이가 휘는 정도 */
  curl?: number
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * 낱장 정점 갱신.
 * 책등에서 바깥쪽으로 짧은 선분을 이어 붙이듯 각도를 누적해 곡면을 만듭니다.
 * 넘기는 중간에는 바깥 모서리가 살짝 늦게 따라오며 종이처럼 휘어집니다.
 */
export function bendLeaf(geom: THREE.BufferGeometry, width: number, segments: number, pose: LeafPose) {
  const { t, yRight, yLeft, slopeLeft } = pose
  const curl = pose.curl ?? 1
  const pos = geom.attributes.position as THREE.BufferAttribute
  const arr = pos.array as Float32Array
  const base = t * (Math.PI - slopeLeft)
  const bend = -Math.sin(Math.PI * t) * 0.95 * curl
  const lift = Math.sin(Math.PI * t) * 0.18 * curl
  const hingeY = yRight + (yLeft - yRight) * smooth(t)
  const ds = width / segments
  let x = 0
  let y = hingeY
  for (let i = 0; i <= segments; i++) {
    for (let r = 0; r < 2; r++) {
      const k = (i * 2 + r) * 3
      arr[k] = x
      arr[k + 1] = y
    }
    const s = (i + 0.5) / segments
    // 책등 가까이는 살짝 들리고(lift) 바깥은 뒤처지는(bend) 곡선
    const a = base + lift * (1 - s) + bend * s * s
    x += Math.cos(a) * ds
    y += Math.sin(a) * ds
  }
  pos.needsUpdate = true
  geom.computeVertexNormals()
}

/** 둥근 모서리 사각형 */
function roundedRect(w: number, h: number, r: number, x0 = 0, y0 = -h / 2) {
  const s = new THREE.Shape()
  s.moveTo(x0 + r, y0)
  s.lineTo(x0 + w - r, y0)
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
  s.lineTo(x0 + w, y0 + h - r)
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h)
  s.lineTo(x0 + r, y0 + h)
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r)
  s.lineTo(x0, y0 + r)
  s.quadraticCurveTo(x0, y0, x0 + r, y0)
  return s
}

/**
 * 하드커버 판 — 둥근 모서리 + 부드러운 베벨.
 * 결과: x 0→w (책등→바깥), y 0→t (아래→위), z ±h/2. 윗면 UV 는 표지 그림과 일치합니다.
 */
export function createBoardGeometry(w: number, h: number, t: number, radius: number) {
  const bevel = Math.min(t * 0.35, 0.0016)
  const geom = new THREE.ExtrudeGeometry(roundedRect(w, h, radius), {
    depth: t - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  })
  // 판을 눕혀 두께가 y 방향이 되도록 (shape y → -z)
  geom.rotateX(-Math.PI / 2)
  geom.translate(0, bevel, 0)
  // UV 를 표지 크기 기준 0–1 로 다시 계산
  const pos = geom.attributes.position as THREE.BufferAttribute
  const uv = geom.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w, 0.5 - pos.getZ(i) / h)
  }
  uv.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}

/** 둥근 모서리 사각형 판 (책상 상판 등) — 중심 기준 */
export function createSlabGeometry(w: number, d: number, t: number, radius: number, bevel: number) {
  const geom = new THREE.ExtrudeGeometry(roundedRect(w, d, radius, -w / 2, -d / 2), {
    depth: t - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  })
  geom.rotateX(-Math.PI / 2)
  geom.translate(0, bevel, 0)
  const pos = geom.attributes.position as THREE.BufferAttribute
  const uv = geom.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, 0.5 - pos.getZ(i) / d)
  }
  uv.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}
