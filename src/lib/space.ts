/**
 * 사이트 안의 '공간' — 전시관(The Floating Atelier), 디자이너의 책상(The Designer's Desk),
 * 작업 보드(The Process Board).
 * 한 번에 한 공간만 마운트해 WebGL 캔버스와 스크롤 투어가 겹치지 않게 합니다.
 * 실제 전환(빛 가림 → 교체 → 걷힘)은 App 이 맡고, 메뉴 등은 goToSpace() 로 요청만 합니다.
 */
export type Space = 'gallery' | 'desk' | 'process'

/** 전시관 밖 공간의 주소 해시 — 직접 들어오거나 브라우저 뒤로 가기로 오갈 수 있도록 */
export const SPACE_HASH: Record<Exclude<Space, 'gallery'>, string> = {
  desk: '#about',
  process: '#process',
}

export const SPACE_LABEL: Record<Space, string> = {
  gallery: 'The Floating Atelier',
  desk: 'The Designer’s Desk',
  process: 'The Process Board',
}

/** 상단 메뉴에 나오는 이름 (전시관 메뉴의 소개 항목 · 공간 상단 바) */
export const SPACE_NAV: { space: Exclude<Space, 'gallery'>; label: string }[] = [
  { space: 'desk', label: 'About' },
  { space: 'process', label: 'Process' },
]

export function spaceFromLocation(): Space {
  const hash = window.location.hash
  if (hash === SPACE_HASH.desk) return 'desk'
  if (hash === SPACE_HASH.process) return 'process'
  return 'gallery'
}

type Navigator = (space: Space) => void
let navigator: Navigator | null = null

export function registerSpaceNavigator(fn: Navigator | null) {
  navigator = fn
}

export function goToSpace(space: Space) {
  navigator?.(space)
}
