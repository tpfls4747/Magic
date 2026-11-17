/** 다이어리 애니메이션 공유 상태 — 다이어리가 쓰고 카메라가 읽습니다 (리렌더 없이 프레임마다 갱신) */
export class DiaryAnim {
  /** 열림 타임라인 0(닫힘) → 1(펼침 완료) */
  p = 0
  /** 카메라 이동 구간 진행도 (이징 적용) */
  cam = 0

  update(p: number, cam: number) {
    this.p = p
    this.cam = cam
  }
}

export const createDiaryAnim = () => new DiaryAnim()

/** 전체 타임라인 중 [from, to] 구간의 0–1 진행도 */
export const segment = (p: number, from: number, to: number) =>
  Math.min(1, Math.max(0, (p - from) / (to - from)))

/** 부드럽게 감속 */
export const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/** 천천히 시작해 천천히 멈춤 */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
