import type { ContentText } from '../types'

export function StatusTag({ kind }: { kind: 'draft' | 'pending' | 'concept' }) {
  const label = kind === 'draft' ? '임시' : kind === 'pending' ? '자료 필요' : '콘셉트 시안'
  return <span className={`cs-tag cs-tag--${kind}`}>{label}</span>
}

/**
 * 콘텐츠 텍스트 렌더러.
 * - 확정 문자열은 그대로
 * - draft 는 문장 뒤에 '임시' 표시
 * - pending 은 내용 대신 '자료 필요' 표시와 넣어야 할 자료 안내
 */
export function Content({ value }: { value: ContentText | undefined }) {
  if (value === undefined) return null
  if (typeof value === 'string') return <>{value}</>
  if (value.kind === 'draft') {
    return (
      <span className="cs-draft">
        {value.text}
        <StatusTag kind="draft" />
      </span>
    )
  }
  return (
    <span className="cs-pending">
      <StatusTag kind="pending" />
      <span className="cs-pending__note">{value.note}</span>
    </span>
  )
}
