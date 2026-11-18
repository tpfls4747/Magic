/**
 * Contact 섹션 이벤트 계약 — 전체 포트폴리오와 연결할 때 사용합니다.
 *  1) props 콜백  <ContactSection onOpened={...} onBackToBeginning={...} />
 *  2) window CustomEvent  window.addEventListener(CONTACT_EVENTS.back, ...)
 */
export type DoorPhase = 'closed' | 'opening' | 'open' | 'closing'

export interface ContactCallbacks {
  /** 문 열기 시작 (클릭·탭·키보드·바로 보기) */
  onOpenStart?: (mode: 'cinematic' | 'instant') => void
  /** 문이 완전히 열리고 연락처가 표시됨 */
  onOpened?: () => void
  /** 문 닫기 시작 (Close Door · ESC) */
  onCloseStart?: () => void
  /** 문이 닫히고 초기 상태로 돌아옴 */
  onClosed?: () => void
  /** 'Back to the Beginning' — 호스트가 맨 처음(Intro/Hero)으로 이동시키세요 */
  onBackToBeginning?: () => void
  /** 연락 버튼 클릭 (분석·로그용) */
  onContactClick?: (method: 'email' | 'linkedin') => void
  onPhaseChange?: (phase: DoorPhase) => void
}

export const CONTACT_EVENTS = {
  openStart: 'unlockmyworld:contact-open-start',
  opened: 'unlockmyworld:contact-opened',
  closeStart: 'unlockmyworld:contact-close-start',
  closed: 'unlockmyworld:contact-closed',
  back: 'unlockmyworld:contact-back-to-beginning',
} as const

export type ContactEventName = (typeof CONTACT_EVENTS)[keyof typeof CONTACT_EVENTS]

export function emitContactEvent(name: ContactEventName) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name))
}
