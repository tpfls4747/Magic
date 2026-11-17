/**
 * 스크롤 투어 상태 — GSAP ScrollTrigger(DOM)와 CameraRig(3D) 사이의 공유 값.
 * React 상태가 아닌 가변 객체라 매 프레임 읽어도 리렌더링이 일어나지 않습니다.
 *
 * progress: 0 = 전시관 전체 구도, 1 = Seat Swap 작품 근접 구도
 */
export const tour = {
  progress: 0,
}
