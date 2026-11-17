/**
 * 스크롤 투어 상태 — GSAP ScrollTrigger(DOM)와 CameraRig(3D) 사이의 공유 값.
 * React 상태가 아닌 가변 객체라 매 프레임 읽어도 리렌더링이 일어나지 않습니다.
 *
 * progress: 투어 위치 (정류장 단위)
 *   0 = 전시관 전체 구도, 1 = 작품 1 (Seat Swap), 2 = 작품 2 (Sign-up Redesign)
 *   1.5 처럼 소수면 두 정류장 사이를 이동 중입니다.
 */
export const tour = {
  progress: 0,
}

/** 투어 순서 — 전체 구도 다음에 들르는 작품 (projects.ts 의 id) */
export const TOUR_PROJECT_IDS = ['seat-swap', 'signup-redesign'] as const
