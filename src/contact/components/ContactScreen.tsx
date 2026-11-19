import { forwardRef } from 'react'
import type { ContactContent } from '../data/content'
import { displayUrl, linkedinHref, mailtoHref, type ContactLinks } from '../data/links'

interface ContactScreenProps {
  content: ContactContent
  links: ContactLinks
  titleId: string
  onContactClick: (method: 'email' | 'linkedin') => void
}

/**
 * 문을 지나 들어온 뒤의 Contact 전용 화면 — 3D 텍스처가 아닌 접근 가능한 HTML.
 * 큰 제목 · 소개 문구 · Email · LinkedIn 을 가운데에 에디토리얼하게 배치합니다.
 * 주소가 비어 있으면(data/links.ts) 링크 대신 '준비 중' 으로 표시되고, 값을 넣는 즉시 실제 링크가 됩니다.
 */
export const ContactScreen = forwardRef<HTMLDivElement, ContactScreenProps>(function ContactScreen(
  { content: c, links, titleId, onContactClick },
  ref,
) {
  const mail = mailtoHref(links.email, c.mailSubject)
  const linked = linkedinHref(links.linkedin)
  const [first, ...rest] = c.finale.titleLines

  const row = (
    method: 'email' | 'linkedin',
    label: string,
    action: string,
    href: string | null,
    value: string,
  ) => {
    const inner = (
      <>
        <span className="cn-row__label">{label}</span>
        <span className={`cn-row__value${href ? '' : ' is-pending'}`}>{href ? value : c.pending}</span>
        <span className="cn-row__action">
          {href ? action : null}
          <span className="cn-row__arrow" aria-hidden="true">
            {method === 'linkedin' ? '↗' : '→'}
          </span>
        </span>
      </>
    )
    return (
      <li className="cn-row-item" data-stagger>
        {href ? (
          <a
            className="cn-row"
            href={href}
            aria-label={`${action} — ${value}${method === 'linkedin' ? ` (${c.a11y.newTab})` : ''}`}
            {...(method === 'linkedin' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={() => onContactClick(method)}
          >
            {inner}
          </a>
        ) : (
          <div className="cn-row is-pending" aria-disabled="true">
            {inner}
          </div>
        )}
      </li>
    )
  }

  return (
    <div ref={ref} className="cn-screen" role="region" aria-labelledby={titleId}>
      <div className="cn-screen__arch" aria-hidden="true" />
      <div className="cn-screen__inner">
        <p className="cn-screen__eyebrow" data-stagger>
          {c.finale.eyebrow}
        </p>
        <h2 id={titleId} className="cn-screen__title" tabIndex={-1} data-stagger>
          <span>{first}</span>
          {rest.map((line) => (
            <em key={line}>{line}</em>
          ))}
        </h2>
        <p className="cn-screen__lead" data-stagger>
          {c.finale.lead}
        </p>
        <ul className="cn-screen__rows">
          {row('email', c.methods.email, c.actions.email, mail, links.email.trim())}
          {row('linkedin', c.methods.linkedin, c.actions.linkedin, linked, linked ? displayUrl(links.linkedin) : '')}
        </ul>
        {(!mail || !linked) && (
          <p className="cn-screen__note" data-stagger>
            {c.pendingHint}
          </p>
        )}
      </div>
    </div>
  )
})
