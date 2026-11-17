import { forwardRef } from 'react'
import type { AboutContent } from '../types'
import { AboutTextValue } from './AboutTextValue'
import { PageContent } from './PageContent'

/**
 * '자기소개 바로 보기' — 다이어리를 열지 않고 전체 내용을 텍스트로 읽는 영역.
 * WebGL 을 쓸 수 없는 환경에서는 기본으로 펼쳐집니다.
 */
export const AboutTextView = forwardRef<HTMLDivElement, { content: AboutContent; id: string }>(
  function AboutTextView({ content, id }, ref) {
    return (
      <div ref={ref} id={id} className="ab-textview" tabIndex={-1} aria-labelledby={`${id}-title`}>
        <div className="ab-textview__inner">
          <header className="ab-textview__head">
            <p className="ab-eyebrow">Behind the Magic · Text</p>
            <h3 id={`${id}-title`} className="ab-textview__title">
              <AboutTextValue value={content.name} />
            </h3>
            <p className="ab-textview__role">
              <AboutTextValue value={content.role} />
            </p>
          </header>
          <div className="ab-textview__pages">
            {content.pages.map((page) => (
              <div key={page.id} id={`${id}-${page.id}`} className="ab-textview__page" tabIndex={-1}>
                <PageContent page={page} level={4} headingId={`${id}-${page.id}-title`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
)
