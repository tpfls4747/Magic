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
 * 주요 시점(초). 미리보기 검수·캡처 스크립트도 이 값을 참고합니다.
 *
 *  Stage A  Unlock          0.00 – 3.1
 *  Stage B  Cinematic Zoom  3.15 – 5.0   (지수 접근 → 끝에서 급가속)
 *           Stillness       5.0 – 5.2   (가득 찬 채 숨 멈춤)
 *  Stage C  Magical Burst   5.2 –        (Three.js 입자·링·섬광)
 *  Stage D  Transition      5.45 – 5.95 빛이 화면을 덮음 → covered → (autoReveal) 걷힘
 */
export const INTRO_TIMING = {
  zoomStart: 3.15,
  zoomEnd: 5.0,
  burst: 5.2,
  coverStart: 5.45,
  covered: 5.95,
} as const

/**
 * 열쇠 클릭 이후 전체 시퀀스를 만듭니다.
 * 호출할 때마다 anim 값을 초기 상태에서 다시 시작하므로 다시 실행해도 항상 같은 결과가 나옵니다.
 */
export function buildUnlockTimeline(
  anim: IntroAnim,
  el: TimelineTargets,
  hooks: TimelineHooks,
  opts: { reducedMotion: boolean; autoReveal: boolean },
) {
  const tl = gsap.timeline()
  const T = INTRO_TIMING

  if (opts.reducedMotion) {
    // 움직임 최소화: 짧은 삽입·회전 → 부드러운 크로스페이드 (확대·폭발·흔들림 없음)
    tl.to(el.ui, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(anim, { parallax: 0, keyFly: 1, duration: 0.5, ease: 'power1.inOut' }, 0)
      .to(anim, { keyInsert: 1, duration: 0.25, ease: 'power1.in' }, 0.5)
      .to(anim, { keyTurn: 1, glow: 0.6, duration: 0.3 }, 0.8)
      .to(anim, { shackleLift: 1, seam: 1, duration: 0.3, ease: 'power2.out' }, 1.1)
      .call(hooks.onUnlocked, [], 1.15)
      .fromTo(el.flash, { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, duration: 0.6, ease: 'power1.inOut' }, 1.4)
      .call(hooks.onCovered, [], 2.0)
      .set(el.canvas, { autoAlpha: 0 }, 2.0)
  } else {
    tl
      // ── Stage A · Unlock ───────────────────────────────
      .to(el.ui, { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.out' }, 0)
      .to(anim, { parallax: 0, duration: 0.7, ease: 'power2.out' }, 0)
      // 열쇠가 포물선을 그리며 날아와 구멍 앞에서 감속
      .to(anim, { keyFly: 1, duration: 1.0, ease: 'power3.inOut' }, 0)
      .to(anim, { camSide: 1, duration: 1.3, ease: 'power2.inOut' }, 0.05)
      // 긴장: 조준한 채 살짝 뒤로 물러서며 숨 고르기
      .to(anim, { keyAnticipate: 1, duration: 0.3, ease: 'sine.out' }, 0.95)
      // 단번에 삽입 (끝에서 가장 빠름) — 동시에 물러섰던 만큼 회수
      .to(anim, { keyInsert: 1, duration: 0.24, ease: 'power4.in' }, 1.25)
      .to(anim, { keyAnticipate: 0, duration: 0.24, ease: 'power2.in' }, 1.25)
      // 찰칵 — 짧고 단단한 반동
      .to(anim, { recoil: 1, duration: 0.05, ease: 'power2.out' }, 1.49)
      .to(anim, { recoil: 0, duration: 0.45, ease: 'elastic.out(1, 0.5)' }, 1.54)
      .to(anim, { glow: 0.22, duration: 0.4, ease: 'power1.out' }, 1.49)
      // 2단 회전 — 내부 텀블러가 하나씩 걸리는 느낌 (걸쇠가 미세하게 들썩)
      .to(anim, { keyTurn: 0.5, duration: 0.24, ease: 'back.out(2)' }, 1.78)
      .to(anim, { recoil: -0.45, shackleLift: 0.05, duration: 0.05 }, 2.0)
      .to(anim, { recoil: 0, shackleLift: 0.02, duration: 0.3, ease: 'elastic.out(1, 0.5)' }, 2.05)
      .to(anim, { keyTurn: 1, duration: 0.26, ease: 'back.out(2.2)' }, 2.2)
      .to(anim, { recoil: -0.8, duration: 0.05 }, 2.44)
      .to(anim, { recoil: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' }, 2.49)
      // 해제 — 걸쇠가 튀어 오르고 금빛이 새어 나옴
      .to(anim, { shackleLift: 1, duration: 0.42, ease: 'back.out(2.6)' }, 2.44)
      .call(hooks.onUnlocked, [], 2.47)
      .to(anim, { glow: 0.75, seam: 1, duration: 0.45, ease: 'power2.out' }, 2.44)
      .fromTo(anim, { burst: 0 }, { burst: 1, duration: 1.6, ease: 'power2.out' }, 2.44)
      .to(anim, { keyDissolve: 1, duration: 0.7, ease: 'power1.in' }, 2.62)
      .to(anim, { shackleSwing: 1, duration: 0.85, ease: 'power2.inOut' }, 2.72)
      .to(anim, { camSide: 0, duration: 1.15, ease: 'power2.inOut' }, 2.85)
      // ── Stage B · Cinematic Zoom ───────────────────────
      .call(hooks.onZoom, [], T.zoomStart)
      // 거리 자체가 지수적으로 줄어 갈수록 빨라지고, power1.in 으로 마지막을 한 번 더 몰아붙임
      .to(anim, { zoom: 1, duration: T.zoomEnd - T.zoomStart, ease: 'power1.in' }, T.zoomStart)
      .to(anim, { glow: 0.9, duration: 1.2, ease: 'power1.in' }, T.zoomStart + 0.3)
      // 가득 찬 순간의 정적 — 거의 멈춘 채 아주 미세하게만 다가오며 빛이 응축됨
      .to(anim, { zoomHold: 1, duration: T.burst - T.zoomEnd, ease: 'sine.inOut' }, T.zoomEnd)
      .to(anim, { glow: 1.25, duration: T.burst - T.zoomEnd, ease: 'power2.in' }, T.zoomEnd)
      // ── Stage C · Magical Burst ────────────────────────
      .fromTo(anim, { magicBurst: 0 }, { magicBurst: 1, duration: 1.7, ease: 'none' }, T.burst)
      // ── Stage D · Transition ──────────────────────────
      // 폭발의 코어 섬광이 퍼지는 동안 같은 색조의 빛이 화면 전체를 덮음
      .fromTo(
        el.flash,
        { autoAlpha: 0, scale: 0.85 },
        { autoAlpha: 1, scale: 1, duration: T.covered - T.coverStart, ease: 'power2.in' },
        T.coverStart,
      )
      .call(hooks.onCovered, [], T.covered)
      .set(el.canvas, { autoAlpha: 0 }, T.covered)
  }

  if (opts.autoReveal) {
    // 덮인 직후 바로 걷기 시작 — 폭발 → 덮음 → 노출이 하나의 동작처럼 이어지도록
    const end = (opts.reducedMotion ? 2.0 : T.covered) + 0.22
    tl.call(hooks.onRevealStart, [], end)
      .to(
        el.flash,
        { autoAlpha: 0, scale: 1.18, duration: opts.reducedMotion ? 0.6 : 1.3, ease: 'power2.out' },
        end,
      )
      .call(hooks.onComplete, [], end + (opts.reducedMotion ? 0.6 : 1.3))
  }
  return tl
}
