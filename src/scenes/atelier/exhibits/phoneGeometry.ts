import * as THREE from 'three'

/**
 * 전시용 스마트폰 치수와 형상 헬퍼.
 * 실제 비율(약 1 : 2.05)을 유지하되, 원거리에서도 읽히도록 실제보다 크게 만든 조형물입니다.
 */
export const PHONE = {
  width: 0.38,
  height: 0.78,
  depth: 0.036,
  cornerRadius: 0.062,
  /** 모서리를 둥글게 깎는 베벨 */
  bevel: 0.008,
  /** 화면(디스플레이) 크기 */
  screenWidth: 0.352,
  screenHeight: 0.7528,
  screenRadius: 0.048,
} as const

/** 앞면(유리) 표면의 z */
export const PHONE_FACE_Z = PHONE.depth / 2

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
