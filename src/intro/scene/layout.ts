import * as THREE from 'three'

/** 자물쇠 몸체 치수 — 다른 부품들이 이 값을 기준으로 배치됩니다 */
export const LOCK = {
  bodyDepth: 0.42,
  bevelThickness: 0.15,
  bevelSize: 0.11,
  /** 몸체 앞면 z */
  frontZ: 0.42 / 2 + 0.15,
  /** 열쇠 구멍 원 중심 y */
  keyholeY: -0.14,
  shackle: { halfSpan: 0.5, top: 1.5, leftBottom: 0.3, rightBottom: 0.74, radius: 0.1, lift: 0.44 },
} as const

/** 열쇠 구멍 중심(자물쇠 로컬 좌표) */
export const KEYHOLE = new THREE.Vector3(0, LOCK.keyholeY, LOCK.frontZ)

/** 카메라가 바라보는 기준점 */
export const LOOK_TARGET = new THREE.Vector3(0, 0.15, 0)
