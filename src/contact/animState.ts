/** GSAP 가 쓰고 useFrame 이 읽는 공유 값 (리렌더 없이 매 프레임 반영). 대부분 0 → 1 */
export interface DoorAnim {
  /** 문손잡이 레버가 내려간 정도 */
  handle: number
  /** 걸쇠가 풀리며 문이 살짝 들썩이는 반응 (-1 ~ 1) */
  unlatch: number
  /** 문짝 열림 (0 닫힘 → 1 완전히 열림) */
  leaf: number
  /** 문 너머의 빛 (문틈 → 문 전체) */
  light: number
  /** 카메라가 문으로 다가간 정도 */
  cam: number
  /** 마우스·포커스 hover 강조 */
  hover: number
  /** 마우스 패럴랙스 허용 */
  parallax: number
  /** 카메라가 열린 문을 통과해 문 너머로 들어간 정도 (사이트의 자동 진입 연출) */
  pass: number
}

export function createDoorAnim(): DoorAnim {
  return { handle: 0, unlatch: 0, leaf: 0, light: 0, cam: 0, hover: 0, parallax: 1, pass: 0 }
}

/** 장면 시계 (미리보기에서 느리게 재생할 때 scale 조절) */
export const doorClock = { time: 0, delta: 0, scale: 1 }
