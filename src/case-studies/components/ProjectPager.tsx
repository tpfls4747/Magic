import type { MouseEvent } from 'react'
import type { ResolvedCaseStudy } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

interface ProjectPagerProps {
  prev?: ResolvedCaseStudy
  next?: ResolvedCaseStudy
  getHref: (id: string) => string
  onNavigate?: (id: string, e: MouseEvent<HTMLAnchorElement>) => void
}

/** 이전 / 다음 프로젝트 이동 */
export function ProjectPager({ prev, next, getHref, onNavigate }: ProjectPagerProps) {
  if (!prev && !next) return null
  const item = (study: ResolvedCaseStudy, dir: 'prev' | 'next') => (
    <a
      className={`cs-pager__link cs-pager__link--${dir}`}
      href={getHref(study.id)}
      onClick={onNavigate ? (e) => onNavigate(study.id, e) : undefined}
      rel={dir}
    >
      <span className="cs-pager__dir">
        {dir === 'prev' ? (
          <>
            <span className="cs-pager__arrow" aria-hidden="true">←</span> Previous Project
          </>
        ) : (
          <>
            Next Project <span className="cs-pager__arrow" aria-hidden="true">→</span>
          </>
        )}
      </span>
      <span className="cs-pager__index">{pad(study.index)}</span>
      <span className="cs-pager__title">{study.title}</span>
      <span className="cs-pager__subtitle">{study.subtitle}</span>
    </a>
  )

  return (
    <nav className="cs-pager" aria-label="다른 프로젝트">
      {prev ? item(prev, 'prev') : <span />}
      {next ? item(next, 'next') : <span />}
    </nav>
  )
}
