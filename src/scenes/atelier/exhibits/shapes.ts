import * as THREE from 'three'

/** 전시 작품들이 공유하는 2D 형상 헬퍼 (중심 원점) */

export function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

/** 둥근 사각 평면 — 텍스처가 사각 전체(0~1)에 맞게 UV 를 정규화 */
export function roundedRectGeometry(w: number, h: number, r: number, segments = 12) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), segments)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  }
  uv.needsUpdate = true
  return g
}

/** 둥근 사각 테두리 띠 — 바깥 w×h 에서 안쪽으로 band 만큼의 링 */
export function roundedFrameShape(w: number, h: number, r: number, band: number) {
  const outer = roundedRectShape(w, h, r)
  const inner = roundedRectShape(w - band * 2, h - band * 2, Math.max(r - band, 0.001))
  outer.holes.push(new THREE.Path(inner.getPoints(12).reverse()))
  return outer
}
