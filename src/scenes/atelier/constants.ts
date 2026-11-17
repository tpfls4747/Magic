// The Floating Atelier — 공간 치수(단위: m)와 팔레트
// 실제 건축 비례를 기준으로 잡아 카메라 원근감이 자연스럽게 느껴지도록 합니다.

export const HALL = {
  /** 홀 내부 폭의 절반 (벽 안쪽 면 기준) */
  halfWidth: 6,
  /** 볼트(둥근 천장)가 시작되는 높이 */
  springHeight: 5.6,
  /** 뒤쪽 벽 앞면의 z 좌표 */
  backZ: -18,
  /** 앞쪽 끝 (카메라 뒤) */
  frontZ: 10,
  /** 측면 벽 두께 */
  wallDepth: 0.4,
  /** 측면 아치 개구부 */
  sideArch: { width: 2.4, spring: 3.2 },
  /** 측면 아치 중심 z 좌표 — 홀 중앙(z=-4) 기준 대칭 */
  sideArchCenters: [-16, -12, -8, -4, 0, 4, 8],
  /** 기둥 z 좌표 (아치 사이) */
  columnZ: [-14, -10, -6, -2, 2, 6],
  /** 기둥 중심 x (벽에 반쯤 묻힌 기둥) */
  columnX: 5.62,
  /** 아치 너머 외부 회랑 벽 */
  outerWallX: 8.8,
} as const

export const HALL_LENGTH = HALL.frontZ - HALL.backZ
export const HALL_CENTER_Z = (HALL.frontZ + HALL.backZ) / 2

export const PALETTE = {
  ivory: '#faf6ee',
  cream: '#f3ebdd',
  plaster: '#e6dac7',
  stone: '#e9ddca',
  floor: '#e8dccb',
  champagne: '#dcc08e',
  champagneLight: '#ecd7a8',
  lavender: '#cfc3e6',
  lavenderMist: '#e9e2f1',
  lavenderDeep: '#b9a6dc',
  lavenderGlow: '#d9cdef',
  warmLight: '#fff1dc',
  fog: '#eee6e2',
} as const

/** 전시대 배치 — 중앙 하나를 뒤로 물려 깊이감 있는 삼각 구도를 만듭니다. */
export const PEDESTALS: { position: [number, number, number] }[] = [
  { position: [-3.1, 0, -3.6] },
  { position: [0, 0, -6.4] },
  { position: [3.1, 0, -3.6] },
]
