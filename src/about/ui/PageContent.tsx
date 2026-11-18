import type { AboutPage } from '../types'
import { AboutTextValue } from './AboutTextValue'

interface PageContentProps {
  page: AboutPage
  /** 제목 요소 레벨 (섹션 구조에 맞게) */
  level?: 3 | 4
  headingId?: string
  /** 제목에 프로그램 포커스를 줄 수 있도록 */
  focusableHeading?: boolean
}

/** 다이어리 한 펼침면의 내용을 HTML 로 — 모바일 읽기 화면 · 텍스트 보기 · 스크린 리더가 공유 */
export function PageContent({ page, level = 3, headingId, focusableHeading }: PageContentProps) {
  const H = level === 3 ? 'h3' : 'h4'
  const Sub = level === 3 ? 'h4' : 'h5'
  return (
    <article className="ab-page" aria-labelledby={headingId}>
      <header className="ab-page__head">
        <p className="ab-page__number">Page {page.number}</p>
        <H id={headingId} className="ab-page__title" tabIndex={focusableHeading ? -1 : undefined}>
          {page.title}
        </H>
        <p className="ab-page__subtitle">{page.subtitle}</p>
      </header>
      <p className="ab-page__intro">
        <AboutTextValue value={page.intro} />
      </p>
      {page.blocks.map((block, i) =>
        block.type === 'paragraph' ? (
          <section key={i} className="ab-page__block">
            <Sub className="ab-page__block-title">{block.heading}</Sub>
            <p>
              <AboutTextValue value={block.text} />
            </p>
          </section>
        ) : (
          <section key={i} className="ab-page__block">
            {block.heading && <Sub className="ab-page__block-title">{block.heading}</Sub>}
            <ol className="ab-page__items">
              {block.items.map((item) => (
                <li key={item.name} className="ab-page__item">
                  <span className="ab-page__item-name">{item.name}</span>
                  {item.label && <span className="ab-page__item-label">{item.label}</span>}
                  <span className="ab-page__item-desc">
                    <AboutTextValue value={item.description} />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ),
      )}
    </article>
  )
}
