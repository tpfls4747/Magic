import { gsap } from 'gsap'
import type { IntroAnim } from './animState'

export interface TimelineHooks {
  onUnlocked: () => void
  onZoom: () => void
  onCovered: () => void
  onRevealStart: () => void
  onComplete: () => void
}

export interface TimelineTargets {
  /** 안내 문구·버튼 */
  ui: HTMLElement | null
  /** 화면을 덮는 빛 */
  flash: HTMLElement | null
  /** 3D 캔버스 래퍼 */
  canvas: HTMLElement | null
}

/**
 * 열쇠 클릭 이후 전체 시퀀스.
 *   열쇠 비행 → 삽입(찰칵) → 회전 → 걸쇠 해제 + 빛 입자 → 열쇠 소멸
 *   → 카메라 정면 복귀 + 자물쇠가 카메라 쪽으로 확대 → 빛이 화면을 덮음(covered)
 *   → (autoReveal) 빛이 걷히며 완료(complete)
 */
export function buildUnlockTimeline(
  anim: IntroAnim,
  el: TimelineTargets,
  hooks: TimelineHooks,
  opts: { reducedMotion: boolean; autoReveal: boolean },
) {
  const tl = gsap.timeline()

  if (opts.reducedMotion) {
    // 움직임 최소화: 짧은 삽입·회전 후 부드러운 크로스페이드
    tl.to(el.ui, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(anim, { parallax: 0, keyFly: 1, duration: 0.5, ease: 'power1.inOut' }, 0)
      .to(anim, { keyInsert: 1, duration: 0.25, ease: 'power1.in' }, 0.5)
      .to(anim, { keyTurn: 1, glow: 0.6, duration: 0.3 }, 0.8)
      .to(anim, { shackleLift: 1, duration: 0.3, ease: 'power2.out' }, 1.1)
      .call(hooks.onUnlocked, [], 1.15)
      .to(el.flash, { autoAlpha: 1, duration: 0.6, ease: 'power1.inOut' }, 1.4)
      .call(hooks.onCovered, [], 2.0)
      .set(el.canvas, { autoAlpha: 0 }, 2.0)
  } else {
    tl.to(el.ui, { autoAlpha: 0, y: 12, duration: 0.6, ease: 'power2.out' }, 0)
      .to(anim, { parallax: 0, duration: 0.8, ease: 'power2.out' }, 0)
      // 1) 열쇠가 포물선을 그리며 열쇠 구멍 앞으로
      .to(anim, { keyFly: 1, duration: 1.15, ease: 'power2.inOut' }, 0)
      .to(anim, { camSide: 1, duration: 1.4, ease: 'power2.inOut' }, 0.1)
      // 2) 삽입 — 찰칵 하는 반동
      .to(anim, { keyInsert: 1, duration: 0.42, ease: 'power3.in' }, 1.2)
      .to(anim, { recoil: 1, duration: 0.07, ease: 'power2.out' }, 1.62)
      .to(anim, { recoil: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' }, 1.69)
      .to(anim, { glow: 0.3, duration: 0.5, ease: 'power1.out' }, 1.62)
      // 3) 90° 회전
      .to(anim, { keyTurn: 1, duration: 0.6, ease: 'back.inOut(1.6)' }, 1.95)
      .to(anim, { recoil: -0.6, duration: 0.06 }, 2.5)
      .to(anim, { recoil: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }, 2.56)
      // 4) 걸쇠 해제 + 빛 입자 폭발 + 열쇠가 빛으로 흩어짐
      .to(anim, { shackleLift: 1, duration: 0.5, ease: 'back.out(2.4)' }, 2.5)
      .call(hooks.onUnlocked, [], 2.55)
      .to(anim, { glow: 0.85, duration: 0.6, ease: 'power2.out' }, 2.5)
      .fromTo(anim, { burst: 0 }, { burst: 1, duration: 1.8, ease: 'power2.out' }, 2.5)
      .to(anim, { keyDissolve: 1, duration: 0.8, ease: 'power1.in' }, 2.7)
      .to(anim, { shackleSwing: 1, duration: 1.0, ease: 'power2.inOut' }, 2.85)
      // 5) 정면으로 돌아오며 자물쇠가 카메라 쪽으로 다가와 화면을 채움
      .to(anim, { camSide: 0, duration: 1.3, ease: 'power2.inOut' }, 2.9)
      .call(hooks.onZoom, [], 3.25)
      .to(anim, { zoom: 1, duration: 1.7, ease: 'power3.in' }, 3.25)
      .to(anim, { glow: 1, duration: 1.0, ease: 'power1.in' }, 3.6)
      // 6) 마법의 빛이 화면을 가득 채움
      .to(el.flash, { autoAlpha: 1, duration: 0.6, ease: 'power2.in' }, 4.45)
      .call(hooks.onCovered, [], 5.05)
      .set(el.canvas, { autoAlpha: 0 }, 5.05)
  }

  if (opts.autoReveal) {
    const end = tl.duration()
    tl.call(hooks.onRevealStart, [], end + 0.35)
      .to(el.flash, { autoAlpha: 0, duration: opts.reducedMotion ? 0.6 : 1.2, ease: 'power2.out' }, end + 0.35)
      .call(hooks.onComplete)
  }
  return tl
}
