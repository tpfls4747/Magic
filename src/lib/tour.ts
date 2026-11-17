import { useSyncExternalStore } from 'react'
import { getProject, type Project } from '@/data/projects'

/**
 * 전시관 탐색 상태 — 스크롤 투어와 직접 이동(작품 클릭·Works 메뉴·Back to Gallery)이 함께 쓰는 하나의 상태.
 *
 * 기준은 항상 '스크롤 위치'입니다.
 * - 스크롤하면 GSAP ScrollTrigger 가 progress 를 갱신하고, 카메라는 투어 경로를 따라갑니다.
 * - 직접 이동하면 스크롤 위치를 목표 작품의 감상 구간으로 즉시 맞추고(→ progress 도 목표로),
 *   카메라만 flight 로 현재 구도에서 목표 구도까지 곧장 날아갑니다.
 *   비행이 끝나면 progress 가 이미 목표와 같으므로 카메라 점프 없이 스크롤 투어로 이어집니다.
 *
 * React 상태가 아닌 가변 객체라 매 프레임 읽어도 리렌더링이 일어나지 않습니다.
 */

/** 직접 이동 중인 카메라 비행 */
export interface Flight {
  /** 새 비행마다 바뀌는 번호 — 카메라가 출발 구도를 다시 기록하는 기준 */
  id: number
  /** 목표 정류장 */
  to: number
  /** 0~1 진행값 (이징은 카메라 쪽에서 적용) */
  t: number
}

export const tour = {
  /**
   * 투어 위치 (정류장 단위) — 0 = 전시관 전체, 1 = 작품 1, 2 = 작품 2 …
   * 1.5 처럼 소수면 두 정류장 사이를 스크롤로 이동 중입니다.
   */
  progress: 0,
  /** 직접 이동 중이면 비행 정보, 아니면 null */
  flight: null as Flight | null,
}

/** 투어 순서 — 전체 구도(정류장 0) 다음에 들르는 작품 (projects.ts 의 id) */
export const TOUR_PROJECT_IDS = ['seat-swap', 'signup-redesign'] as const
export type TourProjectId = (typeof TOUR_PROJECT_IDS)[number]

/** 투어에 포함된 작품 데이터 (투어 순서) */
export const TOUR_PROJECTS: Project[] = TOUR_PROJECT_IDS.map((id) => getProject(id)).filter(
  (p): p is Project => Boolean(p),
)

/** 정류장 번호: 0 = 전시관 전체, 1.. = TOUR_PROJECT_IDS 순서 */
export const GALLERY_STOP = 0
export const stopOfProject = (id: TourProjectId) => TOUR_PROJECT_IDS.indexOf(id) + 1

// ─────────────────────────────────────────────
// 현재 머무는 정류장 (React 구독용)
// 이동 중이면 null — 작품 인터랙션 활성화, 메뉴의 현재 위치 표시에 사용합니다.
// ─────────────────────────────────────────────

let activeStop: number | null = GALLERY_STOP
const listeners = new Set<() => void>()

export function setActiveStop(stop: number | null) {
  if (stop === activeStop) return
  activeStop = stop
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useActiveStop() {
  return useSyncExternalStore(subscribe, () => activeStop, () => GALLERY_STOP)
}

// ─────────────────────────────────────────────
// 직접 이동 — 실제 동작은 ScrollTour 가 등록합니다 (ScrollTrigger 를 가진 곳)
// ─────────────────────────────────────────────

export interface GoToOptions {
  /** 도착 후 해당 화면의 제목으로 키보드 포커스를 옮깁니다 (메뉴·버튼에서 이동할 때) */
  focus?: boolean
}

type Navigator = (stop: number, options?: GoToOptions) => void
let navigator: Navigator | null = null

export function registerTourNavigator(fn: Navigator | null) {
  navigator = fn
}

/** 정류장으로 이동 (0 = 전시관 전체) */
export function goToStop(stop: number, options?: GoToOptions) {
  navigator?.(stop, options)
}

// ─────────────────────────────────────────────
// 전체 구도에서 3D 작품 위에 마우스를 올렸을 때 표시할 안내 (React 구독용)
// ─────────────────────────────────────────────

let hoveredProject: TourProjectId | null = null
const hoverListeners = new Set<() => void>()

export function setHoveredProject(id: TourProjectId | null) {
  if (id === hoveredProject) return
  hoveredProject = id
  hoverListeners.forEach((l) => l())
}

export function useHoveredProject() {
  return useSyncExternalStore(
    (l) => {
      hoverListeners.add(l)
      return () => hoverListeners.delete(l)
    },
    () => hoveredProject,
    () => null,
  )
}
