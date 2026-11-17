import * as THREE from 'three'

/**
 * 하트 윤곽 (원점 중심, 폭 ≈ 2.1, 높이 ≈ 1.95).
 * 위쪽 두 봉우리 꼭대기가 (±0.5, 0.95) — 걸쇠 다리가 정확히 여기로 들어갑니다.
 */
export function heartShape(scale = 1): THREE.Shape {
  const s = (v: number) => v * scale
  const shape = new THREE.Shape()
  shape.moveTo(0, s(-1.0))
  shape.bezierCurveTo(s(-0.32), s(-0.72), s(-1.05), s(-0.32), s(-1.05), s(0.22))
  shape.bezierCurveTo(s(-1.05), s(0.7), s(-0.78), s(0.95), s(-0.5), s(0.95))
  shape.bezierCurveTo(s(-0.24), s(0.95), s(-0.06), s(0.8), s(0), s(0.6))
  shape.bezierCurveTo(s(0.06), s(0.8), s(0.24), s(0.95), s(0.5), s(0.95))
  shape.bezierCurveTo(s(0.78), s(0.95), s(1.05), s(0.7), s(1.05), s(0.22))
  shape.bezierCurveTo(s(1.05), s(-0.32), s(0.32), s(-0.72), s(0), s(-1.0))
  return shape
}

/** 하트 윤곽을 3D 닫힌 곡선으로 (테두리 장식·열쇠 고리용) */
export function heartCurve(scale: number, z = 0, divisions = 96): THREE.CatmullRomCurve3 {
  const pts = heartShape(scale)
    .getSpacedPoints(divisions)
    .slice(0, -1)
    .map((p) => new THREE.Vector3(p.x, p.y, z))
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal')
}

/** 열쇠 구멍 윤곽 — 원 중심 (0, 0), 슬롯은 아래로 */
export function keyholePath<T extends THREE.Path>(target: T, r = 0.12, slotTop = 0.05, slotBottom = 0.08, depth = 0.4) {
  const yJoin = -Math.sqrt(r * r - slotTop * slotTop)
  const start = Math.atan2(yJoin, -slotTop)
  const end = Math.atan2(yJoin, slotTop)
  target.moveTo(-slotBottom, -depth)
  target.lineTo(-slotTop, yJoin)
  target.absarc(0, 0, r, start, end, true)
  target.lineTo(slotBottom, -depth)
  target.lineTo(-slotBottom, -depth)
  return target
}

/** 3D 원호 (XY 평면) */
class Arc3 extends THREE.Curve<THREE.Vector3> {
  private cx: number
  private cy: number
  private r: number
  private a0: number
  private a1: number
  constructor(cx: number, cy: number, r: number, a0: number, a1: number) {
    super()
    this.cx = cx
    this.cy = cy
    this.r = r
    this.a0 = a0
    this.a1 = a1
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * t
    return target.set(this.cx + Math.cos(a) * this.r, this.cy + Math.sin(a) * this.r, 0)
  }
}

/**
 * 걸쇠(샤클) U자 경로. 왼쪽 다리가 길어 회전축 역할을 하고,
 * 오른쪽 다리는 짧아 들어 올리면 몸체에서 빠져나옵니다.
 */
export function shacklePath(halfSpan: number, top: number, leftBottom: number, rightBottom: number) {
  const path = new THREE.CurvePath<THREE.Vector3>()
  path.add(new THREE.LineCurve3(new THREE.Vector3(-halfSpan, leftBottom, 0), new THREE.Vector3(-halfSpan, top, 0)))
  path.add(new Arc3(0, top, halfSpan, Math.PI, 0))
  path.add(new THREE.LineCurve3(new THREE.Vector3(halfSpan, top, 0), new THREE.Vector3(halfSpan, rightBottom, 0)))
  return path
}

/** 열쇠 이(bit) 윤곽 — 샤프트 오른쪽(+X)으로 돌출, 홈 2개 */
export function keyBitShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0.04)
  s.lineTo(0.24, 0.04)
  s.lineTo(0.24, 0.12)
  s.lineTo(0.17, 0.12)
  s.lineTo(0.17, 0.17)
  s.lineTo(0.24, 0.17)
  s.lineTo(0.24, 0.27)
  s.lineTo(0.13, 0.27)
  s.lineTo(0.13, 0.31)
  s.lineTo(0.2, 0.31)
  s.lineTo(0.2, 0.38)
  s.lineTo(0, 0.38)
  s.lineTo(0, 0.04)
  return s
}

/**
 * 브릴리언트 컷 느낌의 보석 — 테이블(윗면)·크라운·거들·파빌리온을 8분할 선반 회전체로.
 * 테이블 면이 +Z(카메라 쪽)를 향합니다. flatShading 머티리얼과 함께 쓰면 면마다 반사가 갈립니다.
 */
export function gemGeometry(r: number, stretchY = 1, facets = 8): THREE.BufferGeometry {
  // 아래(뾰족한 큘릿)에서 위(테이블)로 — LatheGeometry 의 면 방향이 바깥을 향하도록
  const pts = [
    new THREE.Vector2(0.0001, -r * 1.0),
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
