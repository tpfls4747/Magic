import type { ExhibitObject, Project } from '@/data/projects'
import { GALLERY_STOP, goToStop } from '@/lib/tour'
import './ExhibitPanel.css'

/** 작품별 인터랙션 안내 문구 */
const EXHIBIT_HINT: Record<ExhibitObject, { hover: string; touch: string }> = {
  'golden-ticket': { hover: '티켓에 마우스를 올려 보세요', touch: '티켓을 탭해 보세요' },
  smartphone: { hover: '스마트폰에 마우스를 올려 보세요', touch: '스마트폰을 탭해 보세요' },
  browser: { hover: '작품에 마우스를 올려 보세요', touch: '작품을 탭해 보세요' },
}

/**
 * 작품 근접 화면의 프로젝트 소개 패널.
 * 3D 작품과 겹치지 않도록 가로 화면에서는 오른쪽, 세로 화면에서는 아래쪽에 놓입니다.
 * 표시/숨김(투명도)은 ScrollTour 가 스크롤 진행값에 맞춰 제어합니다.
 */
export function ExhibitPanel({ project }: { project: Project }) {
  const number = String(project.index).padStart(2, '0')
  const headingId = `exhibit-${project.id}-title`

  return (
    <section
      className="exhibit-panel"
      data-tour={`panel-${project.id}`}
      aria-labelledby={headingId}
    >
      <div className="exhibit-panel__card">
        <p className="exhibit-panel__eyebrow">
          <span>Exhibit {number}</span>
          <span aria-hidden="true">·</span>
          <span>{project.tags.join(' / ')}</span>
        </p>
        <h2 id={headingId} className="exhibit-panel__title" tabIndex={-1}>
          {project.title}
        </h2>
        <p className="exhibit-panel__subtitle">{project.subtitle}</p>
        <p className="exhibit-panel__summary">{project.summary}</p>

        <div className="exhibit-panel__actions">
          <div className="exhibit-panel__buttons">
            <CaseStudyButton id={project.id} url={project.caseStudyUrl} />
            <button
              type="button"
              className="back-button"
              onClick={() => goToStop(GALLERY_STOP, { focus: true })}
            >
              <span aria-hidden="true">←</span> Back to Gallery
            </button>
          </div>
          <p className="exhibit-panel__hint">
            <span className="only-hover">{EXHIBIT_HINT[project.object].hover}</span>
            <span className="only-touch">{EXHIBIT_HINT[project.object].touch}</span>
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
function CaseStudyButton({ id, url }: { id: string; url?: string }) {
  const noteId = `case-soon-${id}`
  if (url) {
    return (
      <a className="case-button" href={url}>
        View Case Study
        <span className="case-button__arrow" aria-hidden="true">→</span>
      </a>
    )
  }
  return (
    // disabled 대신 aria-disabled — 키보드·화면 낭독기로도 '준비 중' 상태를 확인할 수 있도록 포커스는 받되 동작하지 않음
    <button
      type="button"
      className="case-button"
      aria-disabled="true"
      aria-describedby={noteId}
      onClick={(e) => e.preventDefault()}
    >
      View Case Study
      <span id={noteId} className="case-button__badge">
        준비 중
      </span>
    </button>
  )
}
