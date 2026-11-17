import { SECTION_META, sectionDomId } from '../sections'
import type { CaseSection, SectionId } from '../types'
import { Blocks } from './blocks/Blocks'
import { Reveal } from './Reveal'
import { Content } from './Text'

const pad = (n: number) => String(n).padStart(2, '0')

/** 공통 섹션 — 번호 · 영문 제목 · 한국어 라벨 · 소개문 · 소제목별 블록 */
export function Section({ id, order, section }: { id: SectionId; order: number; section: CaseSection }) {
  const meta = SECTION_META[id]
  const headingId = `${sectionDomId(id)}-title`

  return (
    <section
      id={sectionDomId(id)}
      className={`cs-section cs-section--${id}`}
      aria-labelledby={headingId}
      tabIndex={-1}
    >
      <Reveal className="cs-section__head">
        <p className="cs-section__number" aria-hidden="true">
          {pad(order)}
        </p>
        <div>
          <p className="cs-section__label">{meta.label}</p>
          <h2 id={headingId} className="cs-section__title">
            {meta.title}
          </h2>
        </div>
      </Reveal>

      {section.intro && (
        <Reveal className="cs-section__intro">
          <p>
            <Content value={section.intro} />
          </p>
        </Reveal>
      )}

      {section.subsections.map((sub) => (
        <div key={sub.heading} className="cs-subsection">
          <Reveal className="cs-subsection__head">
            {sub.kicker && <p className="cs-subsection__kicker">{sub.kicker}</p>}
            <h3 className="cs-subsection__title">{sub.heading}</h3>
          </Reveal>
          <div className="cs-subsection__body">
            <Blocks blocks={sub.blocks} />
          </div>
        </div>
      ))}
    </section>
  )
}
