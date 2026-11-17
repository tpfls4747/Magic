import type { CSSProperties } from 'react'
import type {
  CardsBlock,
  ContentBlock,
  FactsBlock,
  FlowBlock,
  GalleryBlock,
  LinksBlock,
  ListBlock,
  MediaBlock,
  ProseBlock,
  StatementBlock,
} from '../../types'
import { MediaFigure } from '../Media'
import { Reveal } from '../Reveal'
import { Content, StatusTag } from '../Text'
import { isPending } from '../text-utils'

const pad = (n: number) => String(n).padStart(2, '0')

/** 데이터의 블록 배열을 순서대로 그립니다 */
export function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  )
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'prose':
      return <Prose block={block} />
    case 'list':
      return <List block={block} />
    case 'facts':
      return <Facts block={block} />
    case 'cards':
      return <Cards block={block} />
    case 'statement':
      return <Statement block={block} />
    case 'flow':
      return <Flow block={block} />
    case 'media':
      return <Media block={block} />
    case 'gallery':
      return <Gallery block={block} />
    case 'links':
      return <Links block={block} />
  }
}

function Prose({ block }: { block: ProseBlock }) {
  return (
    <Reveal className={`cs-block cs-prose ${block.lead ? 'cs-prose--lead' : ''}`}>
      {block.paragraphs.map((p, i) => (
        <p key={i}>
          <Content value={p} />
        </p>
      ))}
    </Reveal>
  )
}

function List({ block }: { block: ListBlock }) {
  const Tag = block.style === 'numbered' ? 'ol' : 'ul'
  return (
    <Reveal className="cs-block">
      <Tag className={`cs-list cs-list--${block.style ?? 'bullet'}`}>
        {block.items.map((item, i) => (
          <li key={i}>
            <Content value={item} />
          </li>
        ))}
      </Tag>
    </Reveal>
  )
}

function Facts({ block }: { block: FactsBlock }) {
  return (
    <Reveal className="cs-block">
      <dl className="cs-facts">
        {block.items.map((item) => (
          <div key={item.label} className="cs-facts__row">
            <dt>{item.label}</dt>
            <dd>
              <Content value={item.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  )
}

function Cards({ block }: { block: CardsBlock }) {
  const numbered = block.variant === 'numbered'
  return (
    <ul className={`cs-block cs-cards cs-cards--${block.columns ?? 3}`}>
      {block.items.map((card, i) => (
        <li key={i} className={`cs-card ${isPending(card.title) ? 'is-pending' : ''}`}>
          <Reveal delay={i * 90} className="cs-card__inner">
            {numbered && <span className="cs-card__number">{pad(i + 1)}</span>}
            {card.label && <span className="cs-card__label">{card.label}</span>}
            <h4 className="cs-card__title">
              <Content value={card.title} />
            </h4>
            {card.body && (
              <p className="cs-card__body">
                <Content value={card.body} />
              </p>
            )}
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

function Statement({ block }: { block: StatementBlock }) {
  return (
    <Reveal className="cs-block cs-statement">
      {block.label && <p className="cs-statement__label">{block.label}</p>}
      <blockquote className="cs-statement__text">
        <Content value={block.text} />
      </blockquote>
    </Reveal>
  )
}

function Flow({ block }: { block: FlowBlock }) {
  return (
    <Reveal className="cs-block cs-flow-wrap">
      {block.status === 'draft' && (
        <p className="cs-flow__status">
          <StatusTag kind="draft" /> 흐름 초안 — 실제 설계 자료로 교체 예정
        </p>
      )}
      <ol className="cs-flow" style={{ '--cs-steps': block.steps.length } as CSSProperties}>
        {block.steps.map((step, i) => (
          <li key={i} className="cs-flow__step">
            <span className="cs-flow__index" aria-hidden="true">
              {pad(i + 1)}
            </span>
            <span className="cs-flow__title">{step.title}</span>
            {step.note && (
              <span className="cs-flow__note">
                <Content value={step.note} />
              </span>
            )}
            {step.pain && (
              <span className="cs-flow__pain">
                <span className="cs-flow__pain-label">Pain point</span>
                <Content value={step.pain} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </Reveal>
  )
}

const MEDIA_SIZES = {
  text: '(min-width: 1100px) 720px, 100vw',
  wide: '(min-width: 1100px) 1040px, 100vw',
  full: '100vw',
}

function Media({ block }: { block: MediaBlock }) {
  const width = block.width ?? 'text'
  return (
    <Reveal className={`cs-block cs-bleed cs-bleed--${width}`}>
      <MediaFigure item={block.item} sizes={MEDIA_SIZES[width]} />
    </Reveal>
  )
}

function Gallery({ block }: { block: GalleryBlock }) {
  const cols = block.columns ?? 2
  return (
    <div
      className={`cs-block cs-bleed cs-bleed--wide cs-gallery cs-gallery--${cols}`}
      role="region"
      aria-label="이미지 모음 — 좁은 화면에서는 가로로 넘겨 볼 수 있습니다"
      tabIndex={0}
    >
      {block.items.map((item, i) => (
        <Reveal key={i} delay={i * 110}>
          <MediaFigure item={item} sizes={`(min-width: 1100px) ${Math.round(1040 / cols)}px, 90vw`} />
        </Reveal>
      ))}
    </div>
  )
}

function Links({ block }: { block: LinksBlock }) {
  return (
    <Reveal className="cs-block cs-links">
      {block.items.map((link) => {
        const cls = `cs-button cs-button--${link.variant ?? 'secondary'}`
        return (
          <div key={link.label} className="cs-links__item">
            {link.href ? (
              <a className={cls} href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
                <span className="cs-button__arrow" aria-hidden="true">
                  ↗
                </span>
                <span className="cs-visually-hidden">(새 창에서 열림)</span>
              </a>
            ) : (
              <button type="button" className={cls} disabled>
                {link.label}
                <span className="cs-button__soon">준비 중</span>
              </button>
            )}
            {link.description && (
              <p className="cs-links__desc">
                <Content value={link.description} />
              </p>
            )}
          </div>
        )
      })}
    </Reveal>
  )
}
