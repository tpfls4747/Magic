/**
 * Designer's Desk — 치수(단위: m)와 배치.
 * 실제 가구 비례(책상 높이 76cm, A5 다이어리)를 기준으로 해서 원근감이 자연스럽게 읽히도록 합니다.
 */

export const DESK = {
  width: 1.5,
  depth: 0.78,
  thickness: 0.038,
  /** 상판 윗면 높이 */
  top: 0.76,
  /** 상판 아래 앞판(서랍) 높이 */
  apron: 0.085,
  legHeight: 0.64,
} as const

/** 다이어리 — A5 정도 크기의 하드커버 */
export const DIARY = {
  /** 내지 한 장의 폭 (책등 → 바깥 모서리) */
  pageW: 0.15,
  /** 내지 세로 길이 */
  pageH: 0.21,
  /** 표지 판의 폭 · 세로 (내지보다 살짝 큼) */
  coverW: 0.157,
  coverH: 0.218,
  /** 표지 판 두께 */
  coverT: 0.0042,
  /** 내지 묶음 두께 */
  blockT: 0.02,
  /** 낱장 사이 간격 (z-fighting 방지용, 화면에서는 보이지 않을 만큼 작게) */
  leafGap: 0.00045,
  /** 낱장 곡면 분할 수 */
  leafSegments: 28,
} as const

/** 표지 판 바깥면 기준 닫힌 다이어리의 전체 두께 */
export const DIARY_CLOSED_HEIGHT = DIARY.coverT * 2 + DIARY.blockT + DIARY.leafGap * 6

/**
 * 다이어리 배치 (책등 위치 = 다이어리 그룹 원점).
 * 닫힌 상태: 책상 중앙에서 살짝 왼쪽, 비스듬히 놓임
 * 펼친 상태: 카메라를 향해 반듯하게 정렬, 펼침면 중앙이 책상 중앙
 */
export const DIARY_PLACEMENT = {
  closed: { x: -0.1, z: 0.07, yaw: 0.16 },
  open: { x: 0, z: 0.06, yaw: 0 },
} as const

/** 소품 배치 [x, z] (책상 중심 기준, z+ 가 카메라 쪽) */
export const PROPS = {
  lamp: [0.6, -0.25],
  sketches: [-0.33, -0.2],
  memo: [-0.46, 0.13],
  key: [-0.25, 0.24],
  pen: [0.3, 0.19],
  swatches: [0.47, 0.11],
  orb: [0.08, -0.28],
  pencilCup: [0.33, -0.22],
} as const
