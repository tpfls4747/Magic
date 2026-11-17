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
  /** 삽입 직전 살짝 뒤로 물러서는 '조준' 긴장감 */
  keyAnticipate: number
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
  /** 걸쇠 구멍(이음새)에서 새어 나오는 금빛 */
  seam: number
  /** 자물쇠가 카메라 쪽으로 다가와 화면을 채움 (거리는 지수 보간 → 갈수록 가속) */
  zoom: number
  /** 화면을 채운 직후의 짧은 정적 동안 아주 미세하게 더 다가오는 양 */
  zoomHold: number
  /** 화면을 채운 뒤 터지는 마법 폭발 */
  magicBurst: number
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
    keyAnticipate: 0,
    keyTurn: 0,
    keyDissolve: 0,
    shackleLift: 0,
    shackleSwing: 0,
    recoil: 0,
    glow: 0,
    burst: 0,
    seam: 0,
    zoom: 0,
    zoomHold: 0,
    magicBurst: 0,
    camSide: 0,
    parallax: 1,
    hover: 0,
  }
}

/**
 * 장면 전용 시계. 대기 중 흔들림·반짝임 같은 연속 움직임이 이 시계를 따릅니다.
 * scale 을 바꾸면 GSAP 타임라인과 함께 장면 전체를 느리게 재생할 수 있습니다(미리보기 점검용).
 */
export const introClock = { time: 0, delta: 0, scale: 1 }
