import type { SectionId } from './types'

/** 공통 섹션 제목 — 모든 Case Study 가 같은 목차 구조를 갖습니다 */
export const SECTION_META: Record<SectionId, { title: string; label: string }> = {
  overview: { title: 'Overview', label: '프로젝트 개요' },
  problem: { title: 'Problem', label: '문제 정의' },
  research: { title: 'Research', label: '사용자 조사' },
  solution: { title: 'Design Solution', label: '디자인 해결안' },
  prototype: { title: 'Prototype', label: '프로토타입' },
  reflection: { title: 'Reflection', label: '회고' },
}

/** 섹션 요소의 DOM id — 해시 링크(#cs-overview)와 목차가 공유합니다 */
export const sectionDomId = (id: SectionId | 'hero') => `cs-${id}`
