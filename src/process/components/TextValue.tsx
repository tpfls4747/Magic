import type { ProcessText } from '../types'

export function StatusBadge({ kind }: { kind: 'draft' | 'pending' }) {
  return <span className={`pr-badge pr-badge--${kind}`}>{kind === 'draft' ? '임시' : '작성 필요'}</span>
}

/** 확정 문자열은 그대로, 임시 문구는 '임시' 배지, 작성 필요 항목은 써야 할 내용 안내 */
export function TextValue({ value }: { value: ProcessText }) {
  if (typeof value === 'string') return <>{value}</>
  if (value.kind === 'draft') {
    return (
      <span className="pr-draft">
        {value.text}
        <StatusBadge kind="draft" />
      </span>
    )
  }
  return (
    <span className="pr-pending">
      <StatusBadge kind="pending" />
      <span className="pr-pending__note">{value.note}</span>
    </span>
  )
}
