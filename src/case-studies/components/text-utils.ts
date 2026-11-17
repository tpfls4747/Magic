import type { ContentText } from '../types'

export const isPending = (t: ContentText | undefined) =>
  typeof t === 'object' && t !== null && t.kind === 'pending'

/** 일반 문자열로 읽어야 할 때 (alt, aria-label 등) */
export function plainText(t: ContentText | undefined): string {
  if (t === undefined) return ''
  if (typeof t === 'string') return t
  return t.kind === 'draft' ? t.text : ''
}
