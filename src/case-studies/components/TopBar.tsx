import type { MouseEvent } from 'react'

interface TopBarProps {
  exhibitionHref: string
  onBackToExhibition?: (e: MouseEvent<HTMLAnchorElement>) => void
  projectTitle: string
  /** 읽기 진행률 0–1 */
  progress: number
}

/** 상단 고정 바 — 전시관으로 돌아가기, 사이트 마크, 읽기 진행선 */
export function TopBar({ exhibitionHref, onBackToExhibition, projectTitle, progress }: TopBarProps) {
  return (
    <div className="cs-topbar">
      <div className="cs-topbar__inner">
        <a className="cs-topbar__back" href={exhibitionHref} onClick={onBackToExhibition}>
          <span className="cs-topbar__back-arrow" aria-hidden="true">
            ←
          </span>
          <span className="cs-topbar__back-label">Back to Exhibition</span>
        </a>
        <span className="cs-topbar__mark">Unlock My World</span>
        <span className="cs-topbar__project" aria-hidden="true">
          {projectTitle}
        </span>
      </div>
      <div
        className="cs-topbar__progress"
        role="progressbar"
        aria-label="읽기 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  )
}
