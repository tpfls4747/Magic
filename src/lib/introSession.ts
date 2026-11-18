import { canUseWebGL } from './webgl'

/** 같은 탭에서 Intro 를 이미 지나왔는지 기록하는 키 (sessionStorage — 탭을 닫으면 초기화) */
const SEEN_KEY = 'unlockmyworld:intro-seen'

/**
 * 첫 화면에 황금 자물쇠 Intro 를 보여 줄지 결정합니다.
 *  · 같은 탭에서 처음 방문 → Intro
 *  · 같은 탭에서 새로고침 → 바로 전시관 처음 화면
 *  · `?intro` / `?intro=1` → 항상 Intro, `?intro=0` → 항상 생략
 *  · WebGL 을 쓸 수 없는 환경 → 생략 (전시관의 정적 대체 화면으로 바로)
 */
export function shouldPlayIntro() {
  const param = new URLSearchParams(window.location.search).get('intro')
  if (param === '0' || param === 'skip') return false
  if (!canUseWebGL()) return false
  if (param !== null) return true
  try {
    return window.sessionStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    // 저장소를 쓸 수 없는 환경(일부 사생활 보호 모드·샌드박스 iframe): 매번 Intro
    return true
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // 저장하지 못해도 동작에는 문제가 없습니다 (다음 새로고침에 Intro 가 다시 나올 뿐)
  }
}
