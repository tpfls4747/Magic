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

// 형상 헬퍼는 shapes.ts 로 옮겼습니다 (기존 import 경로 유지를 위해 다시 내보냄)
export { roundedRectGeometry, roundedRectShape } from './shapes'
