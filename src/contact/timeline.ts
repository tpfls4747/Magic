import { gsap } from 'gsap'
import type { DoorAnim } from './animState'

export interface DoorTargets {
  /** 닫힌 상태의 헤드라인 블록 */
  intro: HTMLElement | null
  /** Open the Door / 바로 보기 */
  cta: HTMLElement | null
  /** 연락처 패널 */
  panel: HTMLElement | null
}

/** 주요 시점(초) — 검수·캡처 스크립트와 README 가 참고합니다 */
export const DOOR_TIMING = {
  handleDown: 0.05,
  unlatch: 0.42,
  swingStart: 0.8,
  swingEnd: 3.1,
  panelIn: 2.5,
  total: 3.4,
} as const

const stagger = (panel: HTMLElement | null) => (panel ? panel.querySelectorAll<HTMLElement>('[data-stagger]') : [])

/**
 * 문 열기.
 *  cinematic: 손잡이가 내려감 → 걸쇠가 풀리며 문이 살짝 들썩 → 천천히 열림 + 빛 + 카메라 접근 → 연락처
 *  instant:   (바로 보기 / 동작 줄이기) 긴 연출 없이 열린 상태와 연락처를 곧바로 표시
 * 모든 값은 현재 값에서 출발(to)하므로 닫는 도중에 다시 열어도 튀지 않습니다.
 */
export function buildOpenTimeline(anim: DoorAnim, el: DoorTargets, mode: 'cinematic' | 'instant', reduced: boolean) {
  const tl = gsap.timeline()
  const T = DOOR_TIMING
  if (mode === 'instant' || reduced) {
    const d = reduced ? 0 : 0.5
    tl.to([el.intro, el.cta], { autoAlpha: 0, duration: reduced ? 0.15 : 0.3 }, 0)
      .to(anim, { handle: 0, unlatch: 0, leaf: 1, light: 1, cam: 1, parallax: 0, hover: 0, duration: d, ease: 'power2.out' }, 0)
      .fromTo(el.panel, { autoAlpha: 0, y: reduced ? 0 : 12 }, { autoAlpha: 1, y: 0, duration: reduced ? 0.2 : 0.45, ease: 'power2.out' }, reduced ? 0.05 : 0.25)
      .set(stagger(el.panel), { autoAlpha: 1, y: 0 }, 0)
    return tl
  }
  tl.to(el.intro, { autoAlpha: 0, y: -16, duration: 0.7, ease: 'power2.inOut' }, 0)
    .to(el.cta, { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.in' }, 0)
    .to(anim, { parallax: 0, duration: 0.8, ease: 'power2.out' }, 0)
    .to(anim, { hover: 0.7, duration: 0.3 }, 0)
    // 1) 손잡이가 실제로 내려감
    .to(anim, { handle: 1, duration: 0.38, ease: 'power2.out' }, T.handleDown)
    // 2) 걸쇠가 풀리며 문이 살짝 밀렸다가 숨을 고름 — 문틈 빛이 먼저 번짐
    .to(anim, { unlatch: 1, duration: 0.12, ease: 'power2.out' }, T.unlatch)
    .to(anim, { unlatch: 0.45, duration: 0.4, ease: 'sine.inOut' }, T.unlatch + 0.12)
    .to(anim, { light: 0.16, duration: 0.45, ease: 'sine.out' }, T.unlatch)
    // 3) 힌지 축을 중심으로 천천히 열림 + 빛이 퍼짐 + 카메라가 다가감
    .to(anim, { leaf: 1, duration: T.swingEnd - T.swingStart, ease: 'power2.inOut' }, T.swingStart)
    .to(anim, { unlatch: 0, duration: 0.8, ease: 'sine.out' }, T.swingStart + 0.2)
    .to(anim, { handle: 0, duration: 0.55, ease: 'power2.inOut' }, 1.2)
    .to(anim, { hover: 0, duration: 0.8 }, 1.0)
    .to(anim, { light: 1, duration: 2.1, ease: 'power2.inOut' }, T.swingStart + 0.05)
    .to(anim, { cam: 1, duration: 2.6, ease: 'power2.inOut' }, 0.7)
    // 4) 연락처 등장
    .fromTo(el.panel, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out' }, T.panelIn)
    .fromTo(stagger(el.panel), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power2.out' }, T.panelIn + 0.15)
  return tl
}

/** 문 닫기 — 연락처가 물러나고, 카메라가 뒤로, 문이 닫히며 '딸깍' */
export function buildCloseTimeline(anim: DoorAnim, el: DoorTargets, reduced: boolean) {
  const tl = gsap.timeline()
  if (reduced) {
    tl.to(el.panel, { autoAlpha: 0, duration: 0.15 }, 0)
      .to(anim, { handle: 0, unlatch: 0, leaf: 0, light: 0, cam: 0, parallax: 1, hover: 0, duration: 0 }, 0)
      .to([el.intro, el.cta], { autoAlpha: 1, y: 0, duration: 0.2 }, 0.1)
    return tl
  }
  tl.to(el.panel, { autoAlpha: 0, y: 16, duration: 0.45, ease: 'power2.in' }, 0)
    .to(anim, { cam: 0, duration: 1.8, ease: 'power2.inOut' }, 0.1)
    .to(anim, { leaf: 0, duration: 1.6, ease: 'power2.inOut' }, 0.2)
    .to(anim, { light: 0, duration: 1.5, ease: 'power1.inOut' }, 0.3)
    .to(anim, { handle: 0, hover: 0, duration: 0.3 }, 0)
    .to(anim, { unlatch: -0.7, duration: 0.06 }, 1.8)
    .to(anim, { unlatch: 0, duration: 0.45, ease: 'elastic.out(1, 0.5)' }, 1.86)
    .to(anim, { parallax: 1, duration: 0.8 }, 1.6)
    .to(el.intro, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.55)
    .to(el.cta, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.7)
  return tl
}
