/**
 * 문과 건축 치수 (단위: m). The Floating Atelier 와 같은 실측 비례.
 * 문짝은 벽 뒷면(z = -wall.depth/2)에 달려 안쪽으로 열리므로,
 * 회전하는 동안 아치 상단과 벽 두께를 관통하지 않습니다.
 */
export const DOOR = {
  /** 개구부 폭의 절반 */
  halfWidth: 1.1,
  /** 아치가 시작되는 높이 */
  spring: 2.5,
  /** 벽 두께 */
  wallDepth: 0.6,
  /** 문짝 두께 */
  leafThickness: 0.085,
  /** 두 문짝 사이 틈 (빛이 새어 나오는 선) */
  seamGap: 0.022,
  /** 문짝과 개구부 사이 틈 */
  inset: 0.02,
  /** 완전히 열린 각도 (rad) */
  openAngle: 1.36,
  /** 손잡이 높이 */
  handleY: 1.08,
} as const

/** 개구부 꼭대기 높이 */
export const DOOR_TOP = DOOR.spring + DOOR.halfWidth
/** 문짝 앞면 z (벽 뒷면) */
export const LEAF_FRONT_Z = -DOOR.wallDepth / 2
/** 벽 앞면 z */
export const WALL_FRONT_Z = DOOR.wallDepth / 2

/** 액자처럼 화면에 맞출 문+문틀 영역 */
export const DOOR_BOX = { xMin: -1.6, xMax: 1.6, yMin: 0, yMax: DOOR_TOP + 0.62 } as const
