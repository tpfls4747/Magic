import { useRef, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import {
  GALLERY_STOP,
  registerTourNavigator,
  setActiveStop,
  tour,
  TOUR_PROJECTS,
  type Flight,
  type GoToOptions,
} from '@/lib/tour'
import { ExhibitPanel } from './ExhibitPanel'
import './ScrollTour.css'

/**
 * 스크롤 구간 길이 (화면 높이 단위)
 * TRAVEL: 다음 작품까지 카메라가 이동하는 구간
 * DWELL: 작품 앞에 머무르며 감상하는 구간 (카메라 정지, 설명 패널 유지)
 */
const TRAVEL = 1.3
const DWELL = 0.9
const LAST_DWELL = 0.6
/** 감상 구간 바깥에서 이 거리(전체 대비 비율) 안에 멈추면 감상 구간으로 부드럽게 맞춥니다 */
const SNAP_WINDOW = 0.045
/** 직접 이동 시 감상 구간 안의 도착 지점 (구간 시작 0 ~ 끝 1) — 앞뒤로 스크롤할 여유를 둡니다 */
const ARRIVE_AT = 0.35
/** 직접 이동 비행 시간 (초): 기본 + 정류장 거리당 추가 */
const FLIGHT_BASE = 1.4
const FLIGHT_PER_STOP = 0.45
/** 이 거리 안이면 '정류장에 머무는 중'으로 봅니다 (작품 인터랙션 활성화 기준) */
const AT_STOP = 0.12

/** 스크롤을 시작하는 키 — 직접 이동 중에 누르면 비행을 멈추고 스크롤로 넘깁니다 */
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '])

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 투명도 0 이면 visibility 도 숨겨 보이지 않는 버튼에 포커스가 가지 않게 합니다. */
function reveal(el: HTMLElement | null, alpha: number, shiftPx: number) {
  if (!el) return
  el.style.opacity = alpha.toFixed(3)
  el.style.visibility = alpha < 0.01 ? 'hidden' : 'visible'
  el.style.setProperty('--reveal-y', `${((1 - alpha) * shiftPx).toFixed(1)}px`)
}

/** 각 작품 구간: 스크롤 길이와, 타임라인 전체(0~1)에서 감상 구간이 차지하는 범위 */
function buildSegments(count: number) {
  const segments = Array.from({ length: count }, (_, i) => ({
    travel: TRAVEL,
    dwell: i === count - 1 ? LAST_DWELL : DWELL,
  }))
  const total = segments.reduce((sum, s) => sum + s.travel + s.dwell, 0)
  let t = 0
  const stops = segments.map((s) => {
    const start = (t + s.travel) / total
    t += s.travel + s.dwell
    return { start, end: t / total }
  })
  return { segments, total, stops }
}

/**
 * 감상 구간 근처에서만 살짝 끌어당기는 스냅.
 * 감상 구간 안이거나 멀리 떨어져 있으면 사용자가 멈춘 자리를 그대로 둡니다.
 */
function gentleSnap(stops: { start: number; end: number }[]) {
  const ranges = [{ start: 0, end: 0 }, ...stops]
  return (value: number) => {
    let best = value
    let bestDist = SNAP_WINDOW
    for (const r of ranges) {
      if (value >= r.start && value <= r.end) return value
      const edge = value < r.start ? r.start : r.end
      const dist = Math.abs(value - edge)
      if (dist < bestDist) {
        bestDist = dist
        best = edge
      }
    }
    return best
  }
}

/**
 * 스크롤 투어 — 실제로 스크롤되는 트랙과 GSAP ScrollTrigger 설정.
 *
 * 트랙을 스크롤하는 동안 tour.progress 가 0 → 1 → 2 (전체 → 작품 1 → 작품 2) 로 바뀌고,
 * CameraRig 가 이 값을 읽어 카메라를 각 작품 앞으로 이동시킵니다.
 * 같은 값으로 메인 제목과 작품별 설명 패널이 차례로 나타나고 사라집니다.
 */
export function ScrollTour() {
  const trackRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const projects = TOUR_PROJECTS
  const { segments, stops } = buildSegments(projects.length)

  useGSAP(
    () => {
      const title = document.querySelector<HTMLElement>('[data-tour="hero-title"]')
      const hint = document.querySelector<HTMLElement>('[data-tour="hint"]')
      const panels = projects.map((p) =>
        document.querySelector<HTMLElement>(`[data-tour="panel-${p.id}"]`),
      )
      const last = projects.length
      // 정류장별로 보여야 할 텍스트: [메인 제목, 스크롤 안내, 작품 패널…]
      const elements = [title, hint, ...panels]
      const visibleAt = (stop: number) =>
        elements.map((_, j) => (stop === GALLERY_STOP ? j < 2 : j - 1 === stop))

      /** 직접 이동 중: 출발 시 보이던 텍스트는 먼저 사라지고, 도착 화면의 텍스트가 마지막에 나타남 */
      let flightStartAlpha: number[] = []
      const applyFlight = (f: Flight) => {
        const out = 1 - smoothstep(0, 0.4, f.t)
        const arrive = smoothstep(0.62, 1, f.t)
        const target = visibleAt(f.to)
        elements.forEach((el, j) => {
          const leaving = (flightStartAlpha[j] ?? 0) * out
          reveal(el, target[j] ? Math.max(leaving, arrive) : leaving, j === 0 ? -24 : 20)
        })
        setActiveStop(f.t > 0.62 ? f.to : null)
      }

      const applyScroll = (p: number) => {
        const nearest = Math.round(p)
        setActiveStop(Math.abs(p - nearest) < AT_STOP ? nearest : null)
        if (reducedMotion) {
          // 애니메이션 감소: 가장 가까운 정류장의 화면으로 바로 전환
          const target = visibleAt(nearest)
          elements.forEach((el, j) => reveal(el, target[j] ? 1 : 0, 0))
          return
        }
        reveal(title, 1 - smoothstep(0.02, 0.3, p), -24)
        reveal(hint, 1 - smoothstep(0, 0.12, p), 0)
        panels.forEach((el, i) => {
          const k = i + 1
          const fadeIn = smoothstep(k - 0.28, k - 0.03, p)
          const fadeOut = k === last ? 0 : smoothstep(k + 0.03, k + 0.28, p)
          reveal(el, fadeIn * (1 - fadeOut), 20)
        })
      }

      const apply = () => (tour.flight ? applyFlight(tour.flight) : applyScroll(tour.progress))

      tour.progress = 0
      tour.flight = null
      apply()

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: apply,
        scrollTrigger: {
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          // scrub 숫자 = 스크롤을 따라가는 관성(초). 감소 설정에서는 즉시 반영
          scrub: reducedMotion ? true : 1.2,
          invalidateOnRefresh: true,
          snap: reducedMotion
            ? undefined
            : {
                snapTo: gentleSnap(stops),
                // 스크롤 속도로 멈출 위치를 예측하지 않고, 실제로 멈춘 자리만 기준으로 판단
                inertia: false,
                duration: { min: 0.3, max: 0.9 },
                delay: 0.35,
                ease: 'power1.inOut',
              },
        },
      })
      segments.forEach((s, i) => {
        tl.to(tour, { progress: i + 1, duration: s.travel })
        tl.to({}, { duration: s.dwell }) // 감상 구간 — 카메라 정지
      })
      const trigger = tl.scrollTrigger!

      // ── 직접 이동 ─────────────────────────────
      /** 정류장의 감상 구간 안 스크롤 위치 (px) */
      const scrollYFor = (stop: number) => {
        const range = stop === GALLERY_STOP ? null : stops[stop - 1]
        const at = range ? range.start + (range.end - range.start) * ARRIVE_AT : 0
        return Math.round(trigger.start + (trigger.end - trigger.start) * at)
      }

      /** 스크롤 위치에 맞춰 투어 위치를 즉시 맞춤 (스크럽 관성 없이) */
      const syncToScroll = () => {
        ScrollTrigger.update()
        // 스크럽 관성 트윈이 있으면 끝까지 진행 (감소 설정처럼 스크럽이 즉시 반영이면 트윈이 없음)
        const scrub = trigger.getTween() as unknown
        if (scrub instanceof gsap.core.Tween) scrub.progress(1)
      }

      const focusStop = (stop: number) => {
        const selector =
          stop === GALLERY_STOP
            ? '[data-tour="hero-title"] h1'
            : `[data-tour="panel-${projects[stop - 1]?.id}"] h2`
        document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
      }

      let flightTween: gsap.core.Tween | null = null
      let flightId = 0

      /** 비행을 끝내고 스크롤 투어로 넘김 — 투어 위치는 이미 도착 지점과 같습니다 */
      const endFlight = () => {
        flightTween?.kill()
        flightTween = null
        if (!tour.flight) return
        tour.flight = null
        apply()
      }

      const goTo = (stop: number, options: GoToOptions = {}) => {
        const target = Math.min(Math.max(stop, 0), last)
        const from = tour.flight ? tour.flight.to : tour.progress
        flightTween?.kill()
        flightStartAlpha = elements.map((el) => parseFloat(el?.style.opacity || '0'))

        // 스크롤 위치를 먼저 도착 지점으로 — 이후 스크롤을 다시 시작해도 위치가 일치합니다.
        window.scrollTo(0, scrollYFor(target))

        if (reducedMotion) {
          // 애니메이션 감소: 카메라 이동 없이 즉시 전환
          tour.flight = null
          syncToScroll()
          apply()
          if (options.focus) focusStop(target)
          return
        }

        const flight: Flight = { id: ++flightId, to: target, t: 0 }
        tour.flight = flight
        apply()
        flightTween = gsap.to(flight, {
          t: 1,
          duration: FLIGHT_BASE + FLIGHT_PER_STOP * Math.min(Math.abs(target - from), 2),
          ease: 'none',
          onUpdate: apply,
          onComplete: () => {
            syncToScroll()
            endFlight()
            if (options.focus) focusStop(target)
          },
        })
      }
      registerTourNavigator(goTo)

      // 비행 중에 사용자가 스크롤을 시작하면 비행을 멈추고 스크롤로 넘김
      // (스크롤 위치는 이미 도착 지점이므로 카메라는 그 자리에서 자연스럽게 이어집니다)
      const interrupt = () => {
        if (!tour.flight) return
        syncToScroll()
        endFlight()
      }
      const onKey = (e: KeyboardEvent) => {
        const el = e.target as HTMLElement | null
        // Esc: 작품 화면에서 전시관 전체로 (입력 중이거나 Works 메뉴 안에서는 메뉴가 먼저 처리)
        if (e.key === 'Escape') {
          if (!el?.closest('input, textarea, select, [data-tour-nav]') && tour.progress > 0.5) {
            goTo(GALLERY_STOP, { focus: true })
          }
          return
        }
        // 버튼·링크 위의 Space/화살표는 그 요소의 동작이므로 스크롤로 보지 않음
        if (SCROLL_KEYS.has(e.key) && !el?.closest('button, a, input, textarea, select, [data-tour-nav]')) {
          interrupt()
        }
      }
      window.addEventListener('wheel', interrupt, { passive: true })
      window.addEventListener('touchmove', interrupt, { passive: true })
      window.addEventListener('keydown', onKey)

      return () => {
        registerTourNavigator(null)
        flightTween?.kill()
        tour.flight = null
        window.removeEventListener('wheel', interrupt)
        window.removeEventListener('touchmove', interrupt)
        window.removeEventListener('keydown', onKey)
      }
    },
    { dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <>
      <div ref={trackRef} className="tour-track">
        <section className="tour-stop" aria-label="The Floating Atelier 전시관" />
        {projects.map((p, i) => (
          <section
            key={p.id}
            className="tour-stop"
            style={{ '--stop-length': segments[i].travel + segments[i].dwell } as CSSProperties}
            aria-label={`${p.title} 전시대`}
          />
        ))}
      </div>
      {projects.map((p) => (
        <ExhibitPanel key={p.id} project={p} />
      ))}
    </>
  )
}
