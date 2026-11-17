import { useRef, type CSSProperties } from 'react'
import { getProject, type Project } from '@/data/projects'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap, useGSAP } from '@/lib/gsap'
import { tour, TOUR_PROJECT_IDS } from '@/lib/tour'
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
  const projects = TOUR_PROJECT_IDS.map((id) => getProject(id)).filter(
    (p): p is Project => Boolean(p),
  )
  const { segments, stops } = buildSegments(projects.length)

  useGSAP(
    () => {
      const title = document.querySelector<HTMLElement>('[data-tour="hero-title"]')
      const hint = document.querySelector<HTMLElement>('[data-tour="hint"]')
      const panels = projects.map((p) =>
        document.querySelector<HTMLElement>(`[data-tour="panel-${p.id}"]`),
      )
      const last = projects.length

      const apply = (p: number) => {
        if (reducedMotion) {
          // 애니메이션 감소: 가장 가까운 정류장의 화면으로 바로 전환
          const nearest = Math.round(p)
          reveal(title, nearest === 0 ? 1 : 0, 0)
          reveal(hint, nearest === 0 ? 1 : 0, 0)
          panels.forEach((el, i) => reveal(el, nearest === i + 1 ? 1 : 0, 0))
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

      tour.progress = 0
      apply(0)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => apply(tour.progress),
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
