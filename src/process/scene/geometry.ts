import * as THREE from 'three'

/** 중심 기준 둥근 모서리 사각형 */
export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x0 = -w / 2
  const y0 = -h / 2
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
 * 두께가 있는 둥근 판 (카드 · 보드).
 * 뒷면이 z=0, 앞면이 z=t. groups: 0 = 앞뒷면, 1 = 옆면
 */
export function slab(w: number, h: number, t: number, r: number, bevel = 0) {
  const b = Math.min(bevel, t * 0.3)
  const g = new THREE.ExtrudeGeometry(roundedRect(w - b * 2, h - b * 2, Math.max(0.001, r - b)), {
    depth: t - b * 2,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 8,
  })
  g.translate(0, 0, b)
  normalizeUV(g, w, h)
  return g
}

/** 둥근 사각형 평면 — 인쇄면용 (UV 0–1) */
export function face(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 8)
  normalizeUV(g, w, h)
  return g
}

function normalizeUV(g: THREE.BufferGeometry, w: number, h: number) {
  const pos = g.attributes.position as THREE.BufferAttribute
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  uv.needsUpdate = true
  g.computeVertexNormals()
}
