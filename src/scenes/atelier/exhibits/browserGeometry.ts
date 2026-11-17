/**
 * 전시용 3D 브라우저 치수 (m).
 * 16:10 에 가까운 데스크톱 창 비율 — 뒤쪽 중앙 전시대에서도 읽히도록 실제 모니터보다 큰 조형물입니다.
 * 모든 값은 브라우저 중심(원점) 기준, +z 가 화면 바깥입니다.
 */
export const BROWSER = {
  width: 1.28,
  height: 0.86,
  depth: 0.05,
  cornerRadius: 0.05,
  /** 측면을 둥글게 깎는 베벨 */
  bevel: 0.01,
  /** 앞면 가장자리와 툴바·화면 사이 여백 */
  margin: 0.022,
  toolbarHeight: 0.07,
  /** 툴바와 화면 사이 간격 */
  gap: 0.01,
} as const

/** 앞면(평평한 면)의 z */
export const BROWSER_FACE_Z = BROWSER.depth / 2

const innerWidth = BROWSER.width - BROWSER.bevel * 2 - BROWSER.margin * 2
const top = BROWSER.height / 2 - BROWSER.bevel - BROWSER.margin
const bottom = -BROWSER.height / 2 + BROWSER.bevel + BROWSER.margin

/** 상단 툴바 영역 */
export const TOOLBAR = {
  width: innerWidth,
  height: BROWSER.toolbarHeight,
  centerY: top - BROWSER.toolbarHeight / 2,
} as const

/** 웹페이지가 표시되는 화면 영역 */
export const SCREEN = (() => {
  const screenTop = top - BROWSER.toolbarHeight - BROWSER.gap
  return {
    width: innerWidth,
    height: screenTop - bottom,
    centerY: (screenTop + bottom) / 2,
    radius: 0.018,
  } as const
})()
