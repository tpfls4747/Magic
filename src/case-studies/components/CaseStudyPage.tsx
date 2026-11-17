import type { MouseEvent } from 'react'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { sectionDomId } from '../sections'
import { SECTION_ORDER, type ResolvedCaseStudy } from '../types'
import { BackToTop } from './BackToTop'
import { Hero } from './Hero'
import { ProjectPager } from './ProjectPager'
import { Section } from './Section'
import { TableOfContents } from './TableOfContents'
import { StatusTag } from './Text'
import { TopBar } from './TopBar'
import '../styles/case-study.css'

export interface CaseStudyPageProps {
  study: ResolvedCaseStudy
  /** 전체 프로젝트 수 (히어로의 01 / 03 표시) */
  total: number
  prev?: ResolvedCaseStudy
  next?: ResolvedCaseStudy
  /** 전시관 주소 (기본값 '/') */
  exhibitionHref?: string
  /** 전시관으로 돌아갈 때 라우터 등에서 가로채고 싶다면 사용 */
  onBackToExhibition?: (e: MouseEvent<HTMLAnchorElement>) => void
  /** 다른 프로젝트 상세 페이지 주소 */
  getProjectHref: (id: string) => string
  /** 프로젝트 이동을 클라이언트 라우팅으로 처리하고 싶다면 사용 */
  onNavigateProject?: (id: string, e: MouseEvent<HTMLAnchorElement>) => void
}

const DOM_IDS = SECTION_ORDER.map(sectionDomId)

/**
 * Case Study 상세 페이지.
 * 데이터 하나(study)만 바꾸면 어떤 프로젝트든 같은 구조로 그려집니다.
 * 라우터에 의존하지 않으므로 메인 앱에서는 이 컴포넌트를 그대로 렌더링하면 됩니다.
 */
export function CaseStudyPage({
  study,
  total,
  prev,
  next,
  exhibitionHref = '/',
  onBackToExhibition,
  getProjectHref,
  onNavigateProject,
}: CaseStudyPageProps) {
  const { activeId, progress, scrolledPastFold } = useScrollSpy(DOM_IDS)

  return (
    <div className="cs-root">
      <a className="cs-skip" href={`#${sectionDomId('overview')}`}>
        본문으로 건너뛰기
      </a>

      <TopBar
        exhibitionHref={exhibitionHref}
        onBackToExhibition={onBackToExhibition}
        projectTitle={study.title}
        progress={progress}
      />

      <article className="cs-article" aria-label={`${study.title} 케이스 스터디`}>
        <Hero study={study} total={total} />

        {study.status === 'draft' && (
          <aside className="cs-notice" aria-label="임시 콘텐츠 안내">
            <p className="cs-notice__title">Template Preview</p>
            <p className="cs-notice__body">
              이 페이지는 실제 자료를 채우기 전의 템플릿 미리보기입니다. 아래 표시가 붙은 내용은 실제
              사실이 아닙니다.
            </p>
            <ul className="cs-notice__legend">
              <li>
                <StatusTag kind="draft" /> 방향을 보여주기 위한 임시 문구 · 가설
              </li>
              <li>
                <StatusTag kind="pending" /> 실제 자료로 채워야 하는 자리
              </li>
              <li>
                <StatusTag kind="concept" /> 코드로 그린 임시 시안
              </li>
            </ul>
          </aside>
        )}

        <div className="cs-layout">
          <TableOfContents sections={SECTION_ORDER} activeId={activeId} />
          <div className="cs-content">
            {SECTION_ORDER.map((id, i) => (
              <Section key={id} id={id} order={i + 1} section={study.sections[id]} />
            ))}
          </div>
        </div>
      </article>

      <footer className="cs-footer">
        <ProjectPager prev={prev} next={next} getHref={getProjectHref} onNavigate={onNavigateProject} />
        <div className="cs-footer__bar">
          <a className="cs-footer__back" href={exhibitionHref} onClick={onBackToExhibition}>
            <span aria-hidden="true">←</span> Back to Exhibition
          </a>
          <span className="cs-footer__mark">Unlock My World</span>
        </div>
      </footer>

      <BackToTop visible={scrolledPastFold} />
    </div>
  )
}
