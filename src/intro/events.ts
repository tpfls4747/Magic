/**
 * 황금 자물쇠 Intro 이벤트 계약.
 *
 * 전시관(App)과 Intro는 서로를 import하지 않습니다.
 * 연결은 두 가지 방식 중 하나로 할 수 있습니다.
 *  1) React props 콜백 — <GoldenLockIntro onCovered={...} onComplete={...} />
 *  2) window CustomEvent — window.addEventListener(INTRO_EVENTS.complete, ...)
 */

export type IntroPhase =
  | 'idle' // 열쇠를 기다리는 중
  | 'unlocking' // 열쇠 비행 → 삽입 → 회전 → 걸쇠 해제
  | 'zooming' // 자물쇠가 카메라 쪽으로 다가옴
  | 'covered' // 마법의 빛이 화면을 가득 채움 (전시관을 이 아래에 마운트할 시점)
  | 'revealing' // 빛이 걷히며 아래 화면이 드러남
  | 'done' // Intro 종료 — 언마운트해도 안전

export interface IntroCallbacks {
  /** 진입: 첫 프레임이 렌더되어 Intro가 화면에 보이기 시작함 */
  onEnter?: () => void
  /** 사용자가 열쇠를 눌러 해제 시퀀스가 시작됨 */
  onUnlockStart?: () => void
  /** 걸쇠(샤클)가 튀어 올라 자물쇠가 열림 */
  onUnlocked?: () => void
  /** 빛이 화면을 완전히 덮음 — 이 시점에 전시관을 아래에 마운트하면 끊김 없이 전환됩니다 */
  onCovered?: () => void
  /** 완료: 빛이 걷히고 Intro가 끝남 — 이후 Intro를 언마운트하세요 */
  onComplete?: () => void
  /** 단계가 바뀔 때마다 호출 (디버깅·사운드 연동용) */
  onPhaseChange?: (phase: IntroPhase) => void
}

/** window 로 함께 발행되는 CustomEvent 이름 */
export const INTRO_EVENTS = {
  enter: 'unlockmyworld:intro-enter',
  unlockStart: 'unlockmyworld:intro-unlock-start',
  unlocked: 'unlockmyworld:intro-unlocked',
  covered: 'unlockmyworld:intro-covered',
  complete: 'unlockmyworld:intro-complete',
} as const

export type IntroEventName = (typeof INTRO_EVENTS)[keyof typeof INTRO_EVENTS]

export function emitIntroEvent(name: IntroEventName) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name))
}
