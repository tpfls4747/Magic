import * as THREE from 'three'

/**
 * 바닥에서 시작하는 아치형 개구부 정의
 * x: 개구부 중심, width: 폭, spring: 아치가 시작되는 높이(반원 시작점)
 */
export interface ArchOpening {
  x: number
  width: number
  spring: number
}

/**
 * 아치형 개구부가 뚫린 벽의 외곽선을 만듭니다.
 * 개구부가 바닥에 닿아 있으므로 hole 대신 외곽선 자체에 아치를 포함시킵니다.
 * top 은 벽 상단 처리 방식을 결정합니다. ('flat' 또는 반원 루네트)
 */
export function archedWallShape(
  width: number,
  height: number,
  openings: ArchOpening[],
  top: { type: 'flat' } | { type: 'lunette'; radius: number } = { type: 'flat' },
): THREE.Shape {
  const half = width / 2
  const shape = new THREE.Shape()
  shape.moveTo(-half, 0)

  const sorted = [...openings].sort((a, b) => a.x - b.x)
  for (const o of sorted) {
    const r = o.width / 2
    shape.lineTo(o.x - r, 0)
    shape.lineTo(o.x - r, o.spring)
    // 왼쪽 → 꼭대기 → 오른쪽 (시계 방향)
    shape.absarc(o.x, o.spring, r, Math.PI, 0, true)
    shape.lineTo(o.x + r, 0)
  }

  shape.lineTo(half, 0)
  shape.lineTo(half, height)
  if (top.type === 'lunette') {
    shape.absarc(0, height, top.radius, 0, Math.PI, false)
  } else {
    shape.lineTo(-half, height)
  }
  shape.lineTo(-half, 0)
  return shape
}

/**
 * 아치 개구부를 감싸는 U자형 몰딩 띠(아키볼트)
 * innerRadius: 개구부 반지름, band: 띠 폭
 */
export function archivoltShape(
  innerRadius: number,
  band: number,
  spring: number,
): THREE.Shape {
  const ri = innerRadius
  const ro = innerRadius + band
  const s = new THREE.Shape()
  s.moveTo(-ro, 0)
  s.lineTo(-ro, spring)
  s.absarc(0, spring, ro, Math.PI, 0, true)
  s.lineTo(ro, 0)
  s.lineTo(ri, 0)
  s.lineTo(ri, spring)
  s.absarc(0, spring, ri, 0, Math.PI, false)
  s.lineTo(-ri, 0)
  return s
}

/** 아치 안쪽 가장자리를 따라가는 곡선 (금색 트림용 TubeGeometry 경로) */
export class ArchCurve extends THREE.Curve<THREE.Vector3> {
  radius: number
  spring: number
  constructor(radius: number, spring: number) {
    super()
    this.radius = radius
    this.spring = spring
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    // 왼쪽 기둥(아래→위) → 반원 → 오른쪽 기둥(위→아래)을 길이 비례로 매핑
    const r = this.radius
    const legs = this.spring
    const arc = Math.PI * r
    const total = legs * 2 + arc
    const d = t * total
    if (d < legs) return target.set(-r, d, 0)
    if (d < legs + arc) {
      const a = Math.PI - ((d - legs) / arc) * Math.PI
      return target.set(Math.cos(a) * r, legs + Math.sin(a) * r, 0)
    }
    return target.set(r, legs - (d - legs - arc), 0)
  }
}

/**
 * 몰딩 프로파일 헬퍼 — 직선 구간과 둥근 토러스(반원 볼록 몰딩)를 섞어
 * LatheGeometry 용 점 목록을 만듭니다.
 */
export class Profile {
  points: THREE.Vector2[] = []

  to(r: number, y: number) {
    this.points.push(new THREE.Vector2(r, y))
    return this
  }

  /** 현재 높이에서 위로 볼록한 반원 몰딩(torus) 추가 */
  torus(baseR: number, y: number, size: number, steps = 10) {
    const rad = size / 2
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (i / steps) * Math.PI
      this.points.push(new THREE.Vector2(baseR + Math.cos(a) * rad, y + rad + Math.sin(a) * rad))
    }
    return this
  }

  /** 오목한 1/4 원 (cove) — r0,y0 에서 r1,y1 으로 */
  cove(r0: number, y0: number, r1: number, y1: number, steps = 8) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = (t * Math.PI) / 2
      this.points.push(
        new THREE.Vector2(r1 + (r0 - r1) * Math.cos(a), y0 + (y1 - y0) * Math.sin(a)),
      )
    }
    return this
  }

  /** 볼록한 1/4 원 (ovolo) — r0,y0 에서 r1,y1 으로 */
  ovolo(r0: number, y0: number, r1: number, y1: number, steps = 8) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = (t * Math.PI) / 2
      this.points.push(
        new THREE.Vector2(r0 + (r1 - r0) * Math.sin(a), y1 - (y1 - y0) * Math.cos(a)),
      )
    }
    return this
  }
}

/** 고전 기둥 프로파일 (Attic base + 약간 가늘어지는 기둥 몸통 + 단순화된 주두) */
export function columnProfile(height: number): THREE.Vector2[] {
  const p = new Profile()
  p.to(0, 0)
    .to(0.46, 0)
    .to(0.46, 0.14) // 플린스
    .torus(0.42, 0.14, 0.1) // 아래 토러스
    .cove(0.4, 0.24, 0.35, 0.32) // 스코티아
    .torus(0.34, 0.32, 0.06) // 위 토러스
    .to(0.31, 0.4)
  // 엔타시스: 몸통이 위로 갈수록 살짝 가늘어짐
  const shaftTop = height - 0.6
  const steps = 12
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    p.to(0.31 - 0.04 * t * t, 0.4 + (shaftTop - 0.4) * t)
  }
  p.torus(0.27, shaftTop, 0.05) // 목 고리
    .to(0.28, shaftTop + 0.1)
    .ovolo(0.28, shaftTop + 0.1, 0.42, shaftTop + 0.36) // 에키누스
    .to(0.46, shaftTop + 0.38)
    .to(0.46, height) // 아바쿠스
    .to(0, height)
  return p.points
}

/** 전시대 프로파일 — 몰딩이 있는 받침, 위로 가늘어지는 허리, 넓은 상판 */
export function pedestalProfile(height: number): THREE.Vector2[] {
  const p = new Profile()
  p.to(0, 0)
    .to(0.5, 0)
    .to(0.5, 0.05)
    .torus(0.47, 0.05, 0.05)
    .to(0.45, 0.11)
    .cove(0.45, 0.11, 0.3, 0.28)
    .torus(0.29, 0.28, 0.035)
  const waistStart = 0.32
  const waistTop = height - 0.26
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // 아래는 살짝 볼록하고 위로 갈수록 가늘어지는 우아한 허리 곡선
    const r = 0.27 - 0.06 * t + 0.015 * Math.sin(t * Math.PI)
    p.to(r, waistStart + (waistTop - waistStart) * t)
  }
  p.torus(0.215, waistTop, 0.03)
    .to(0.22, waistTop + 0.04)
    .cove(0.22, waistTop + 0.04, 0.42, waistTop + 0.19)
    .to(0.46, waistTop + 0.2)
    .to(0.46, height - 0.01)
    .to(0.45, height)
    .to(0, height)
  return p.points
}

/** 벽 상단 코니스(처마 몰딩) 단면 — x: 벽에서 튀어나온 거리, y: 높이 */
export function corniceShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, -0.42)
  s.lineTo(0.05, -0.42)
  s.lineTo(0.05, -0.34)
  s.quadraticCurveTo(0.14, -0.3, 0.16, -0.2)
  s.lineTo(0.2, -0.18)
  s.lineTo(0.2, -0.1)
  s.quadraticCurveTo(0.32, -0.08, 0.34, 0.02)
  s.lineTo(0.36, 0.04)
  s.lineTo(0.36, 0.1)
  s.lineTo(0, 0.1)
  s.lineTo(0, -0.42)
  return s
}
