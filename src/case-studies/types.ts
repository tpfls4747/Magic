/**
 * Case Study 데이터 스키마.
 *
 * 모든 프로젝트 상세 페이지는 이 스키마를 따르는 데이터 객체 하나로 그려집니다.
 * 새 프로젝트를 추가할 때는 컴포넌트를 고칠 필요 없이 `data/` 에 파일을 하나 만들고
 * `data/index.ts` 레지스트리에 등록하면 됩니다.
 *
 * ── 콘텐츠 상태 표시 규칙 ──────────────────────────────────────────
 * 실제 자료가 없는 내용을 사실처럼 보이게 만들지 않기 위해, 모든 텍스트 값은
 * 아래 세 가지 중 하나입니다.
 *   - string            확정된 실제 내용
 *   - draft('...')      임시 문구 / 가설. 화면에 '임시' 표시가 함께 붙습니다.
 *   - pending('...')    자료 필요. 내용 대신 '무엇을 넣어야 하는지' 안내가 표시됩니다.
 */

/** 임시 문구 — 방향을 보여주기 위한 초안이며 실제 사실이 아님 */
export interface DraftText {
  kind: 'draft'
  text: string
}

/** 자료 필요 — 실제 자료로 채워야 하는 자리 */
export interface PendingText {
  kind: 'pending'
  /** 어떤 자료를 넣어야 하는지에 대한 안내 */
  note: string
}

export type ContentText = string | DraftText | PendingText

export const draft = (text: string): DraftText => ({ kind: 'draft', text })
export const pending = (note: string): PendingText => ({ kind: 'pending', note })

/* ───────────────────────── 이미지 · 시각 자료 ───────────────────────── */

/** `illustrations/index.ts` 에 등록된 코드 기반 시각 자료의 키 */
export type IllustrationKey =
  | 'seat-swap/hero'
  | 'seat-swap/screen-seat-map'
  | 'seat-swap/screen-request'
  | 'seat-swap/screen-confirm'

export interface ImageSource {
  src: string
  /** 원본 가로 크기(px). srcset 생성에 사용합니다. */
  width: number
}

export interface MediaItem {
  /** 실제 이미지. 여러 해상도를 주면 srcset 으로 반응형 로딩합니다. */
  image?: {
    sources: ImageSource[]
    /** 레이아웃 기준 sizes 속성 (기본값은 블록 폭에 맞춤) */
    sizes?: string
  }
  /** 코드로 그린 시각 자료 (실제 이미지가 없을 때 콘셉트 시안으로 사용) */
  illustration?: IllustrationKey
  /** 이미지·시각 자료가 아직 없을 때 표시할 안내 */
  placeholder?: string
  alt: string
  caption?: ContentText
  /** 가로:세로 비율. 예) '16 / 10' */
  aspect?: string
  /**
   * 'concept' 이면 '콘셉트 시안 · 실제 디자인 아님' 표시가 붙습니다.
   * 코드로 그린 임시 목업에는 반드시 지정해주세요.
   */
  status?: 'final' | 'concept'
  /** 배경 톤 */
  tone?: 'ivory' | 'lavender' | 'champagne'
}

/* ───────────────────────────── 콘텐츠 블록 ───────────────────────────── */

export interface ProseBlock {
  type: 'prose'
  paragraphs: ContentText[]
  /** 첫 문단을 큰 리드 문단으로 표시 */
  lead?: boolean
}

export interface ListBlock {
  type: 'list'
  style?: 'bullet' | 'numbered'
  items: ContentText[]
}

export interface FactsBlock {
  type: 'facts'
  items: { label: string; value: ContentText }[]
}

export interface CardsBlock {
  type: 'cards'
  items: { title: ContentText; body?: ContentText; label?: string }[]
  /** 데스크톱 기준 열 개수 (기본 3) */
  columns?: 2 | 3
  /** 'numbered' 는 카드마다 01, 02… 번호를 붙입니다 */
  variant?: 'plain' | 'numbered'
}

export interface StatementBlock {
  type: 'statement'
  label?: string
  text: ContentText
}

export interface FlowBlock {
  type: 'flow'
  /** 흐름 자체가 초안이면 지정 (상단에 '초안' 표시) */
  status?: 'draft'
  steps: { title: string; note?: ContentText; pain?: ContentText }[]
}

export interface MediaBlock {
  type: 'media'
  item: MediaItem
  /** 'wide' 는 본문 폭보다 넓게, 'full' 은 화면 폭 가득 */
  width?: 'text' | 'wide' | 'full'
}

export interface GalleryBlock {
  type: 'gallery'
  items: MediaItem[]
  columns?: 2 | 3
}

export interface LinksBlock {
  type: 'links'
  items: {
    label: string
    /** 주소가 없으면 비활성 '준비 중' 버튼으로 표시 */
    href?: string
    description?: ContentText
    variant?: 'primary' | 'secondary'
  }[]
}

export type ContentBlock =
  | ProseBlock
  | ListBlock
  | FactsBlock
  | CardsBlock
  | StatementBlock
  | FlowBlock
  | MediaBlock
  | GalleryBlock
  | LinksBlock

/* ───────────────────────────── 섹션 구조 ───────────────────────────── */

/** 모든 Case Study 가 공유하는 섹션 순서 (Hero 제외) */
export const SECTION_ORDER = [
  'overview',
  'problem',
  'research',
  'solution',
  'prototype',
  'reflection',
] as const

export type SectionId = (typeof SECTION_ORDER)[number]

export interface CaseSubsection {
  /** 소제목 */
  heading: string
  /** 소제목 위의 작은 영문 라벨 (선택) */
  kicker?: string
  blocks: ContentBlock[]
}

export interface CaseSection {
  /** 섹션 소개 문단 (선택) */
  intro?: ContentText
  subsections: CaseSubsection[]
}

export interface CaseStudyHero {
  /** 한 줄 소개 */
  tagline: ContentText
  media: MediaItem
  meta: {
    type: ContentText
    role: ContentText
    period: ContentText
    tools?: ContentText
  }
}

/**
 * 프로젝트 하나의 상세 페이지 데이터.
 * 제목·부제·번호·태그는 전시관과 공유하는 `src/data/projects.ts` 에서 가져옵니다.
 */
export interface CaseStudyData {
  /** `src/data/projects.ts` 의 project.id 와 같아야 합니다 */
  projectId: string
  /** 'draft' 면 페이지 상단에 '임시 콘텐츠 포함' 안내가 표시됩니다 */
  status: 'draft' | 'published'
  /** 대표 색조 — 히어로 배경 등에 사용 */
  accent?: 'lavender' | 'champagne' | 'rose'
  hero: CaseStudyHero
  sections: Record<SectionId, CaseSection>
}

/** 레지스트리에서 전시관 데이터와 합쳐진 최종 형태 */
export interface ResolvedCaseStudy extends CaseStudyData {
  id: string
  index: number
  title: string
  subtitle: string
  tags: string[]
}
