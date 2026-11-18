import { useEffect, useRef } from 'react'
import type { ProcessStage } from '../types'
import { TextValue } from './TextValue'

interface StageDetailProps {
  stage: ProcessStage
  index: number
  total: number
  note: string
  /** 좁은 화면 — 3D 아래 시트로 표시 */
  sheet: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

/**
 * 선택한 단계의 상세 정보 — 가독성이 좋은 HTML 패널.
 * 제목 · 목적 · 키워드 · 일반적인 방법 · 대표 산출물 · 실제 사례(작성 필요)를 보여주고,
 * 열리거나 단계가 바뀌면 제목으로 포커스를 옮깁니다.
 */
export function StageDetail({ stage, index, total, note, sheet, onPrev, onNext, onClose }: StageDetailProps) {
  const headingId = `pr-detail-${stage.id}`
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.getElementById(headingId)?.focus({ preventScroll: true })
    panelRef.current?.querySelector('.pr-detail__scroll')?.scrollTo({ top: 0 })
  }, [headingId])

  const prev = index > 0
  const next = index < total - 1

  return (
    <aside
      ref={panelRef}
      className={`pr-detail ${sheet ? 'pr-detail--sheet' : ''}`}
      aria-labelledby={headingId}
      key={stage.id}
    >
      <div className="pr-detail__scroll">
        <header className="pr-detail__head">
          <p className="pr-detail__eyebrow">
            Stage {stage.number} <span aria-hidden="true">·</span> {stage.label}
          </p>
          <h3 id={headingId} className="pr-detail__title" tabIndex={-1}>
            {stage.title}
          </h3>
          <button type="button" className="pr-close" onClick={onClose} aria-label="상세 닫고 전체 보드로 돌아가기 (Esc)">
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <section className="pr-detail__block">
          <h4 className="pr-detail__label">목적</h4>
          <p className="pr-detail__purpose">
            <TextValue value={stage.purpose} />
          </p>
        </section>

        <section className="pr-detail__block">
          <h4 className="pr-detail__label">핵심 키워드</h4>
          <ul className="pr-chips">
            {stage.keywords.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>

        <div className="pr-detail__grid">
          <section className="pr-detail__block">
            <h4 className="pr-detail__label">일반적인 방법</h4>
            <ul className="pr-list">
              {stage.methods.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
          <section className="pr-detail__block">
            <h4 className="pr-detail__label">대표 산출물</h4>
            <ul className="pr-list pr-list--gold">
              {stage.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="pr-detail__block">
          <h4 className="pr-detail__label">실제 사례</h4>
          {stage.examples.map((ex, i) => (
            <div key={i} className="pr-example">
              <span className="pr-example__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="1.6" />
                  <path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" strokeLinejoin="round" />
                </svg>
              </span>
              <p>
                <TextValue value={ex} />
              </p>
            </div>
          ))}
        </section>

        <p className="pr-detail__note">{note}</p>
      </div>

      <div className="pr-detail__controls">
        <button type="button" className="pr-ctrl" onClick={onPrev} disabled={!prev}>
          <span aria-hidden="true">←</span> 이전 단계
        </button>
        <span className="pr-detail__count" aria-hidden="true">
          {stage.number} / {String(total).padStart(2, '0')}
        </span>
        <button type="button" className="pr-ctrl" onClick={onNext} disabled={!next}>
          다음 단계 <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  )
}
