/**
 * Process 콘텐츠 스키마.
 *
 * 이 섹션은 '일반적인 UX 설계 과정'을 소개합니다. 실제로 수행한 리서치 · 검증 · 성과처럼 보이지 않도록
 * 개인 사례 자리는 모두 pending() 으로 비워 둡니다.
 *   - string          확정된 내용 (일반적인 방법론 설명, 단계 이름 등)
 *   - draft('...')    방향을 보여주는 임시 문구 (화면에 '임시' 표시)
 *   - pending('...')  실제 경험으로 채워야 하는 자리 (화면에 '작성 필요' 표시 + 안내)
 */
export interface DraftText {
  kind: 'draft'
  text: string
}

export interface PendingText {
  kind: 'pending'
  note: string
}

export type ProcessText = string | DraftText | PendingText

export const draft = (text: string): DraftText => ({ kind: 'draft', text })
export const pending = (note: string): PendingText => ({ kind: 'pending', note })

/** 3D 보드에서 각 단계 옆에 놓이는 소품 종류 */
export type ArtifactKind =
  | 'research-note'
  | 'magnifier'
  | 'observation-memo'
  | 'sticky-notes'
  | 'problem-card'
  | 'hmw-memo'
  | 'wireframe-sheet'
  | 'flow-diagram'
  | 'ui-sketch'
  | 'mini-browser'
  | 'smartphone'
  | 'ui-components'
  | 'feedback-cards'
  | 'checklist'
  | 'revised-screen'

export interface ProcessStage {
  id: 'discover' | 'define' | 'design' | 'prototype' | 'validate'
  number: string
  /** 영문 단계 이름 (3D 카드 제목) */
  title: string
  /** 한국어 단계 이름 */
  label: string
  /** 3D 카드에 표시할 핵심 키워드 (짧게, 2~3개) */
  keywords: string[]
  /** 이 단계의 목적 — 한두 문장 */
  purpose: ProcessText
  /** 일반적으로 사용하는 방법 */
  methods: string[]
  /** 대표 산출물 */
  deliverables: string[]
  /** 실제 프로젝트 사례 자리 */
  examples: ProcessText[]
  /** 3D 보드에서 이 단계 옆에 놓이는 소품 */
  artifacts: ArtifactKind[]
}

export interface ProcessContent {
  /** 다이어리를 열지 않아도 보이는 섹션 소개 */
  lead: ProcessText
  /** 콘텐츠 성격 안내 (일반 방법론임을 밝힘) */
  note: string
  stages: ProcessStage[]
}
