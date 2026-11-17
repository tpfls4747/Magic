import { useRef } from 'react'
import { getProject } from '@/data/projects'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { gsap, useGSAP } from '@/lib/gsap'
import { tour } from '@/lib/tour'
import { ExhibitPanel } from './ExhibitPanel'
import './ScrollTour.css'

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

/**
 * 스크롤 투어 — 실제로 스크롤되는 트랙과 GSAP ScrollTrigger 설정.
 *
 * 트랙을 스크롤하는 동안 tour.progress 가 0 → 1 로 바뀌고,
 * CameraRig 가 이 값을 읽어 카메라를 Seat Swap 전시대로 이동시킵니다.
 * 같은 값으로 메인 제목은 사라지고 프로젝트 패널이 나타납니다.
 */
export function ScrollTour() {
  const trackRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const project = getProject('seat-swap')!

  useGSAP(
    () => {
      const title = document.querySelector<HTMLElement>('[data-tour="hero-title"]')
      const hint = document.querySelector<HTMLElement>('[data-tour="hint"]')
      const panel = document.querySelector<HTMLElement>('[data-tour="panel"]')

      const apply = (p: number) => {
        if (reducedMotion) {
          // 애니메이션 감소: 중간 지점에서 두 화면을 바로 전환
          const atExhibit = p >= 0.5
          reveal(title, atExhibit ? 0 : 1, 0)
          reveal(hint, atExhibit ? 0 : 1, 0)
          reveal(panel, atExhibit ? 1 : 0, 0)
          return
        }
        reveal(title, 1 - smoothstep(0.02, 0.3, p), -24)
        reveal(hint, 1 - smoothstep(0, 0.12, p), 0)
        reveal(panel, smoothstep(0.72, 0.97, p), 20)
      }

      tour.progress = 0
      apply(0)

      gsap.to(tour, {
        progress: 1,
        ease: 'none',
        onUpdate: () => apply(tour.progress),
        scrollTrigger: {
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          // scrub 숫자 = 스크롤을 따라가는 관성(초). 감소 설정에서는 즉시 반영
          scrub: reducedMotion ? true : 1.2,
          invalidateOnRefresh: true,
          // 중간에 멈추면 가까운 화면(전체 구도 또는 작품)으로 부드럽게 정렬
          snap: reducedMotion
            ? undefined
            : { snapTo: [0, 1], duration: { min: 0.5, max: 1.4 }, delay: 0.25, ease: 'power1.inOut' },
        },
      })
    },
    { dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <>
      <div ref={trackRef} className="tour-track">
        <section className="tour-stop tour-stop--hall" aria-label="The Floating Atelier 전시관" />
        <section className="tour-stop tour-stop--exhibit" aria-label={`${project.title} 전시대`} />
      </div>
      <ExhibitPanel project={project} />
    </>
  )
}
