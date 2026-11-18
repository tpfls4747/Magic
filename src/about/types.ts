/**
 * About 콘텐츠 스키마.
 *
 * 실제 경력·능숙도·성과를 지어내지 않기 위해 모든 텍스트 값은 세 가지 중 하나입니다.
 *   - string          확정된 실제 내용
 *   - draft('...')    방향을 보여주는 임시 문구 (화면에 '임시' 표시)
 *   - pending('...')  실제 내용으로 채워야 하는 자리 (화면에 '작성 필요' 표시 + 안내)
 */
export interface DraftText {
  kind: 'draft'
  text: string
}

export interface PendingText {
  kind: 'pending'
  /** 어떤 내용을 써야 하는지에 대한 안내 */
  note: string
}

export type AboutText = string | DraftText | PendingText

export const draft = (text: string): DraftText => ({ kind: 'draft', text })
export const pending = (note: string): PendingText => ({ kind: 'pending', note })

export interface AboutItem {
  /** 항목 이름 (예: UX Research, Figma) */
  name: string
  /** 짧은 한국어 라벨 */
  label?: string
  description: AboutText
}

/** 다이어리 한 펼침면 = 콘텐츠 한 페이지 */
export interface AboutPage {
  id: 'who' | 'what' | 'toolkit'
  /** Page 01 처럼 표시되는 번호 */
  number: string
  title: string
  /** 한국어 부제 */
  subtitle: string
  /** 왼쪽 페이지의 도입 문단 */
  intro: AboutText
  /** 오른쪽 페이지 구성 */
  blocks: AboutBlock[]
}

export type AboutBlock =
  | { type: 'paragraph'; heading: string; text: AboutText }
  | { type: 'items'; heading?: string; items: AboutItem[] }

/** 책상 위 소품 → 다이어리의 특정 페이지로 바로 가는 단축 동작 */
export interface DeskObjectLink {
  object: 'diary' | 'memo' | 'swatches' | 'pencil-cup'
  /** 버튼 · 툴팁에 표시할 이름 */
  label: string
  /** 소품 설명 (스크린 리더 · 모바일 버튼 보조 문구) */
  hint: string
  page: AboutPage['id']
}

export interface AboutContent {
  /** 디자이너 이름 — 다이어리 표지 안쪽에 표시 */
  name: AboutText
  /** 이름 옆의 한 줄 직함 */
  role: AboutText
  /** 다이어리를 열지 않아도 보이는 섹션 소개 문구 */
  lead: AboutText
  pages: AboutPage[]
  deskObjects: DeskObjectLink[]
}
