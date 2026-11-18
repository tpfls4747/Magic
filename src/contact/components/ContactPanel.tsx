import { forwardRef } from 'react'
import type { ContactContent } from '../data/content'
import { displayUrl, linkedinHref, mailtoHref, type ContactLinks } from '../data/links'

interface ContactPanelProps {
  content: ContactContent
  links: ContactLinks
  titleId: string
  onClose: () => void
  onBack: () => void
  onContactClick: (method: 'email' | 'linkedin') => void
}

/**
 * 문이 열린 뒤 나타나는 연락처. 읽기 쉬운 HTML UI.
 * 주소가 비어 있으면 버튼은 '준비 중' 상태(비활성)로 표시되고, 값을 넣는 즉시 실제 링크가 됩니다.
 */
export const ContactPanel = forwardRef<HTMLDivElement, ContactPanelProps>(function ContactPanel(
  { content: c, links, titleId, onClose, onBack, onContactClick },
  ref,
) {
  const mail = mailtoHref(links.email, c.mailSubject)
  const linked = linkedinHref(links.linkedin)
  const anyPending = !mail || !linked

  return (
    <div className="cn-panel-wrap">
      <div ref={ref} className="cn-panel" role="region" aria-labelledby={titleId}>
        <button type="button" className="cn-close" onClick={onClose} aria-label={`${c.closeDoor} (Esc)`}>
          <span aria-hidden="true">×</span> {c.closeDoor}
        </button>

        <p className="cn-panel__eyebrow" data-stagger>
          {c.revealEyebrow}
        </p>
        <h3 id={titleId} className="cn-panel__title" tabIndex={-1} data-stagger>
          {c.revealTitle}
        </h3>
        <p className="cn-panel__body" data-stagger>
          {c.revealBody}
        </p>

        <dl className="cn-methods" data-stagger>
          <div className="cn-method">
            <dt>{c.methods.email}</dt>
            <dd className={mail ? undefined : 'is-pending'}>{mail ? links.email.trim() : c.pending}</dd>
          </div>
          <div className="cn-method">
            <dt>{c.methods.linkedin}</dt>
            <dd className={linked ? undefined : 'is-pending'}>{linked ? displayUrl(links.linkedin) : c.pending}</dd>
          </div>
        </dl>

        <div className="cn-actions" data-stagger>
          {mail ? (
            <a className="cn-btn cn-btn--primary" href={mail} onClick={() => onContactClick('email')}>
              {c.actions.email}
            </a>
          ) : (
            <button type="button" className="cn-btn cn-btn--primary is-pending" disabled>
              {c.actions.email}
              <span className="cn-badge">{c.pending}</span>
            </button>
          )}
          {linked ? (
            <a
              className="cn-btn cn-btn--secondary"
              href={linked}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onContactClick('linkedin')}
            >
              {c.actions.linkedin}
              <span className="cn-sr">({c.a11y.newTab})</span>
              <span aria-hidden="true" className="cn-btn__arrow">
                ↗
              </span>
            </a>
          ) : (
            <button type="button" className="cn-btn cn-btn--secondary is-pending" disabled>
              {c.actions.linkedin}
              <span className="cn-badge">{c.pending}</span>
            </button>
          )}
        </div>
        {anyPending && (
          <p className="cn-hint" data-stagger>
            {c.pendingHint}
          </p>
        )}

        <div className="cn-panel__foot" data-stagger>
          <button type="button" className="cn-back" onClick={onBack}>
            <span aria-hidden="true">↺</span> {c.backToBeginning}
          </button>
        </div>
      </div>
    </div>
  )
})
