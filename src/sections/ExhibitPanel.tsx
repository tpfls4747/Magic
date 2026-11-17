import type { Project } from '@/data/projects'
import './ExhibitPanel.css'

/**
 * 작품 근접 화면의 프로젝트 소개 패널.
 * 3D 작품과 겹치지 않도록 가로 화면에서는 오른쪽, 세로 화면에서는 아래쪽에 놓입니다.
 * 표시/숨김(투명도)은 ScrollTour 가 스크롤 진행값에 맞춰 제어합니다.
 */
export function ExhibitPanel({ project }: { project: Project }) {
  const number = String(project.index).padStart(2, '0')
  const headingId = `exhibit-${project.id}-title`

  return (
    <section className="exhibit-panel" data-tour="panel" aria-labelledby={headingId}>
      <div className="exhibit-panel__card">
        <p className="exhibit-panel__eyebrow">
          <span>Exhibit {number}</span>
          <span aria-hidden="true">·</span>
          <span>{project.tags.join(' / ')}</span>
        </p>
        <h2 id={headingId} className="exhibit-panel__title">
          {project.title}
        </h2>
        <p className="exhibit-panel__subtitle">{project.subtitle}</p>
        <p className="exhibit-panel__summary">{project.summary}</p>

        <div className="exhibit-panel__actions">
          <CaseStudyButton url={project.caseStudyUrl} />
          <p className="exhibit-panel__hint">
            <span className="only-hover">티켓에 마우스를 올려 보세요</span>
            <span className="only-touch">티켓을 탭해 보세요</span>
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * 케이스 스터디 버튼.
 * 상세 페이지 주소가 생기면 링크로 동작하고, 그 전에는 비활성 상태와 '준비 중' 표시를 보여줍니다.
 */
function CaseStudyButton({ url }: { url?: string }) {
  if (url) {
    return (
      <a className="case-button" href={url}>
        View Case Study
        <span className="case-button__arrow" aria-hidden="true">→</span>
      </a>
    )
  }
  return (
    <button type="button" className="case-button" disabled aria-describedby="case-soon">
      View Case Study
      <span id="case-soon" className="case-button__badge">
        준비 중
      </span>
    </button>
  )
}
