import type { AboutText } from '../types'

/** 임시 · 작성 필요 표시 배지 */
export function StatusBadge({ kind }: { kind: 'draft' | 'pending' }) {
  return <span className={`ab-badge ab-badge--${kind}`}>{kind === 'draft' ? '임시' : '작성 필요'}</span>
}

/**
 * About 텍스트 렌더러 — 확정 문자열은 그대로, 임시 문구는 '임시' 배지,
 * 작성 필요 항목은 내용 대신 무엇을 써야 하는지 안내합니다.
 */
export function AboutTextValue({ value }: { value: AboutText }) {
  if (typeof value === 'string') return <>{value}</>
  if (value.kind === 'draft') {
    return (
      <span className="ab-draft">
        {value.text}
        <StatusBadge kind="draft" />
      </span>
    )
  }
  return (
    <span className="ab-pending">
      <StatusBadge kind="pending" />
      <span className="ab-pending__note">{value.note}</span>
    </span>
  )
}
