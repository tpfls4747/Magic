import * as THREE from 'three'

/** 벽: 아래가 뚫린 아치 개구부를 가진 U자 윤곽 (구멍이 외곽선에 닿지 않도록 하나의 경로로) */
export function wallShape(halfW: number, top: number, openHalf: number, spring: number) {
  const s = new THREE.Shape()
  s.moveTo(-halfW, 0)
  s.lineTo(-openHalf, 0)
  s.lineTo(-openHalf, spring)
  s.absarc(0, spring, openHalf, Math.PI, 0, true)
  s.lineTo(openHalf, 0)
  s.lineTo(halfW, 0)
  s.lineTo(halfW, top)
  s.lineTo(-halfW, top)
  s.lineTo(-halfW, 0)
  return s
}

/** 아치를 감싸는 몰딩 띠 (다리 + 반원) */
export function archBandShape(inner: number, width: number, spring: number, bottom = 0) {
  const outer = inner + width
  const s = new THREE.Shape()
  s.moveTo(-outer, bottom)
  s.lineTo(-outer, spring)
  s.absarc(0, spring, outer, Math.PI, 0, true)
  s.lineTo(outer, bottom)
  s.lineTo(inner, bottom)
  s.lineTo(inner, spring)
  s.absarc(0, spring, inner, 0, Math.PI, false)
  s.lineTo(-inner, bottom)
  return s
}

/** 아치 개구부 윤곽 (문 너머 빛 면용) */
export function archOpeningShape(half: number, spring: number) {
  const s = new THREE.Shape()
  s.moveTo(-half, 0)
  s.lineTo(half, 0)
  s.lineTo(half, spring)
  s.absarc(0, spring, half, 0, Math.PI, false)
  s.lineTo(-half, 0)
  return s
}

/**
 * 왼쪽 문짝 윤곽 — 힌지가 원점(x=0), 문짝은 +x 방향으로 개구부 중앙까지.
 * 위쪽은 아치 원(중심 x=halfW, y=spring)을 따라 둥글게.
 */
export function leafShape(halfW: number, spring: number, seamGap: number, inset: number) {
  const r = halfW - inset
  const g = seamGap / 2
  const xr = halfW - g
  const yTop = spring + Math.sqrt(r * r - g * g)
  const a0 = Math.atan2(yTop - spring, -g)
  const s = new THREE.Shape()
  s.moveTo(inset, 0.004)
  s.lineTo(xr, 0.004)
  s.lineTo(xr, yTop)
  s.absarc(halfW, spring, r, a0, Math.PI, false)
  s.lineTo(inset, 0.004)
  return s
}

export function roundedRect(target: THREE.Path, x: number, y: number, w: number, h: number, r: number) {
  target.moveTo(x + r, y)
  target.lineTo(x + w - r, y)
  target.quadraticCurveTo(x + w, y, x + w, y + r)
  target.lineTo(x + w, y + h - r)
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  target.lineTo(x + r, y + h)
  target.quadraticCurveTo(x, y + h, x, y + h - r)
  target.lineTo(x, y + r)
  target.quadraticCurveTo(x, y, x + r, y)
  return target
}

/** 문짝 패널의 테두리 몰딩 (둥근 사각 고리) */
export function panelRingShape(x: number, y: number, w: number, h: number, border: number, r = 0.03) {
  const s = roundedRect(new THREE.Shape(), x, y, w, h, r) as THREE.Shape
  s.holes.push(roundedRect(new THREE.Path(), x + border, y + border, w - border * 2, h - border * 2, r * 0.6))
  return s
}

/** 둥근 사각형 3D 닫힌 곡선 (금 상감선) */
export function roundedRectCurve(x: number, y: number, w: number, h: number, r: number, z: number) {
  const pts = (roundedRect(new THREE.Path(), x, y, w, h, r) as THREE.Path)
    .getSpacedPoints(120)
    .slice(0, -1)
    .map((p) => new THREE.Vector3(p.x, p.y, z))
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal')
}

/** 아치(다리 포함) 3D 경로 — 금 테두리 튜브 */
export function archPath3(radius: number, spring: number, z: number, bottom = 0) {
  const pts: THREE.Vector3[] = []
  const N = 96
  pts.push(new THREE.Vector3(-radius, bottom, z))
  pts.push(new THREE.Vector3(-radius, spring, z))
  for (let i = 1; i < N; i++) {
    const a = Math.PI - (i / N) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * radius, spring + Math.sin(a) * radius, z))
  }
  pts.push(new THREE.Vector3(radius, spring, z))
  pts.push(new THREE.Vector3(radius, bottom, z))
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0)
}

/** 원호 3D 경로 (문짝 위 부채꼴 장식) */
export function arcPath3(cx: number, cy: number, r: number, a0: number, a1: number, z: number) {
  const pts: THREE.Vector3[] = []
  const N = 40
  for (let i = 0; i <= N; i++) {
    const a = a0 + ((a1 - a0) * i) / N
    pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z))
  }
  return new THREE.CatmullRomCurve3(pts)
}

/** 브릴리언트 컷 느낌의 보석 — 테이블 면이 +Z */
export function gemGeometry(r: number, stretchY = 1, facets = 8) {
  const pts = [
    new THREE.Vector2(0.0001, -r),
    new THREE.Vector2(r, -0.04 * r),
    new THREE.Vector2(r, 0.02 * r),
    new THREE.Vector2(r * 0.94, r * 0.16),
    new THREE.Vector2(r * 0.56, r * 0.46),
    new THREE.Vector2(0.0001, r * 0.46),
  ]
  const g = new THREE.LatheGeometry(pts, facets, Math.PI / facets)
  g.rotateX(Math.PI / 2)
  g.scale(1, stretchY, 1)
  return g
}
