/**
 * GSAP 타임라인이 값을 쓰고, R3F useFrame 이 매 프레임 읽어 가는 공유 애니메이션 상태.
 * React state 를 거치지 않으므로 리렌더 없이 60fps 로 움직입니다.
 * 모든 값은 0 → 1 진행도(일부 예외 표기).
 */
export interface IntroAnim {
  /** 열쇠가 대기 위치에서 자물쇠 앞 조준 위치로 이동 */
  keyFly: number
  /** 조준 위치 → 열쇠 구멍 안으로 삽입 */
  keyInsert: number
  /** 열쇠 90° 회전 */
  keyTurn: number
  /** 열쇠가 빛 입자로 흩어지며 사라짐 */
  keyDissolve: number
  /** 걸쇠 상승 */
  shackleLift: number
  /** 걸쇠 회전(옆으로 열림) */
  shackleSwing: number
  /** 자물쇠 반동(삽입·해제 시 찰칵) — -1 ~ 1 */
  recoil: number
  /** 열쇠 구멍·보석에서 새어 나오는 빛 */
  glow: number
  /** 빛 입자 폭발 */
  burst: number
  /** 자물쇠가 카메라 쪽으로 다가와 화면을 채움 */
  zoom: number
  /** 카메라가 3/4 측면으로 비켜 서는 정도 */
  camSide: number
  /** 마우스 패럴랙스 허용 정도 */
  parallax: number
  /** 열쇠 hover 강조 */
  hover: number
}

export function createIntroAnim(): IntroAnim {
  return {
    keyFly: 0,
    keyInsert: 0,
    keyTurn: 0,
    keyDissolve: 0,
    shackleLift: 0,
    shackleSwing: 0,
    recoil: 0,
    glow: 0,
    burst: 0,
    zoom: 0,
    camSide: 0,
    parallax: 1,
    hover: 0,
  }
}
