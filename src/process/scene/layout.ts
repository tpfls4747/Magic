/**
 * Process Board — 치수(m)와 배치.
 * 가로 화면은 넓은 보드에 다섯 단계를 한 줄로, 세로 화면(모바일)은 세로로 긴 보드에 지그재그로 배치합니다.
 * 같은 보드를 화면 비율에 맞게 다시 짜서, 모바일에서도 카드가 지나치게 작아지지 않도록 합니다.
 */
export type BoardOrientation = 'landscape' | 'portrait'

export const CARD = {
  width: 0.54,
  height: 0.71,
  /** 두꺼운 보드지 */
  thickness: 0.014,
  radius: 0.022,
} as const

export interface CardSlot {
  /** 보드 중심 기준 x, y */
  x: number
  y: number
  /** 살짝 비뚤게 붙인 각도 (rad) */
  tilt: number
}

/** 소품 자리 (카드 중심 기준). z 가 크면 보드 앞에 떠 있는 자료 */
export interface ArtifactSlot {
  x: number
  y: number
  z: number
  tilt: number
  /** 소품 크기 배율 (기본 1) */
  scale?: number
}

export interface BoardLayout {
  orientation: BoardOrientation
  width: number
  height: number
  thickness: number
  /** 보드 중심의 높이 */
  centerY: number
  cards: CardSlot[]
  /** 카드 i 의 소품 3개 자리 */
  artifacts: (i: number) => ArtifactSlot[]
}

const landscape: BoardLayout = {
  orientation: 'landscape',
  width: 3.6,
  height: 2.0,
  thickness: 0.07,
  centerY: 1.58,
  cards: [
    { x: -1.38, y: 0.22, tilt: -0.035 },
    { x: -0.69, y: 0.02, tilt: 0.028 },
    { x: 0, y: 0.24, tilt: -0.018 },
    { x: 0.69, y: 0.04, tilt: 0.032 },
    { x: 1.38, y: 0.2, tilt: -0.022 },
  ],
  artifacts: (i) => {
    const flip = i % 2 ? -1 : 1
    return [
      { x: -0.1 * flip, y: -0.56, z: 0, tilt: 0.06 * flip },
      { x: 0.2 * flip, y: -0.6, z: 0, tilt: -0.08 * flip },
      // 떠 있는 자료는 모두 카드 오른쪽 가장자리에 — 이웃 단계와 부딪히지 않도록
      { x: 0.355, y: i % 2 ? 0.24 : -0.12, z: 0.22, tilt: 0.12 * flip },
    ]
  },
}

const portrait: BoardLayout = {
  orientation: 'portrait',
  width: 1.75,
  height: 3.05,
  thickness: 0.07,
  centerY: 1.75,
  cards: [
    { x: -0.37, y: 1.14, tilt: -0.03 },
    { x: 0.37, y: 0.57, tilt: 0.03 },
    { x: -0.37, y: 0, tilt: -0.02 },
    { x: 0.37, y: -0.57, tilt: 0.03 },
    { x: -0.37, y: -1.14, tilt: -0.025 },
  ],
  artifacts: (i) => {
    // 보드에 붙은 자료는 카드 반대편 빈 칸에, 떠 있는 자료는 두 열 사이 가운데 틈에
    const side = i % 2 ? -1 : 1
    return [
      { x: side * 0.63, y: 0.1, z: 0, tilt: 0.06 * side, scale: 0.8 },
      { x: side * 0.67, y: -0.13, z: 0, tilt: -0.07 * side, scale: 0.8 },
      { x: side * 0.37, y: 0.27, z: 0.2, tilt: 0.1 * side, scale: 0.85 },
    ]
  },
}

export const getLayout = (o: BoardOrientation) => (o === 'portrait' ? portrait : landscape)
