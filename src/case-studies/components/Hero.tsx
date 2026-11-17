import { useRef, type PointerEvent } from 'react'
import { sectionDomId } from '../sections'
import type { ResolvedCaseStudy } from '../types'
import { MediaFigure } from './Media'
import { Content } from './Text'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * 히어로 — 프로젝트명, 한 줄 소개, 메타 정보, 대표 목업.
 * 대표 목업은 전시관의 아치 형태를 닮은 프레임 위에 놓이며,
 * 정밀 포인터 환경에서만 아주 작은 기울기(3D 패럴랙스)가 적용됩니다.
 */
export function Hero({ study, total }: { study: ResolvedCaseStudy; total: number }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const { hero } = study

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current
    if (!el || e.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 2 - 1
    const y = ((e.clientY - r.top) / r.height) * 2 - 1
    el.style.setProperty('--cs-px', x.toFixed(3))
    el.style.setProperty('--cs-py', y.toFixed(3))
  }

  const onPointerLeave = () => {
    stageRef.current?.style.setProperty('--cs-px', '0')
    stageRef.current?.style.setProperty('--cs-py', '0')
  }

  const meta: { label: string; value: typeof hero.meta.type }[] = [
    { label: 'Type', value: hero.meta.type },
    { label: 'Role', value: hero.meta.role },
    { label: 'Period', value: hero.meta.period },
  ]
  if (hero.meta.tools) meta.push({ label: 'Tools', value: hero.meta.tools })

  return (
    <header id={sectionDomId('hero')} tabIndex={-1} className={`cs-hero cs-hero--${study.accent ?? 'lavender'}`}>
      <div className="cs-hero__copy">
        <p className="cs-hero__eyebrow">
          <span>Case Study {pad(study.index)}</span>
          <span className="cs-hero__eyebrow-rule" aria-hidden="true" />
          <span>
            {pad(study.index)} / {pad(total)}
          </span>
        </p>
        <h1 className="cs-hero__title">{study.title}</h1>
        <p className="cs-hero__subtitle">{study.subtitle}</p>
        <p className="cs-hero__tagline">
          <Content value={hero.tagline} />
        </p>
      </div>

      <dl className="cs-hero__meta">
        {meta.map((m) => (
          <div key={m.label} className="cs-hero__meta-item">
            <dt>{m.label}</dt>
            <dd>
              <Content value={m.value} />
            </dd>
          </div>
        ))}
      </dl>

      <div
        ref={stageRef}
        className="cs-hero__stage"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div className="cs-hero__arch" aria-hidden="true" />
        <MediaFigure item={hero.media} priority className="cs-hero__media" sizes="(min-width: 900px) 46vw, 92vw" />
      </div>

      <a className="cs-hero__scroll" href={`#${sectionDomId('overview')}`}>
        <span>Read the case</span>
        <i aria-hidden="true" />
      </a>
    </header>
  )
}
