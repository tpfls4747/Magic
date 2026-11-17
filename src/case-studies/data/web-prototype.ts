import { pending, type CaseStudyData } from '../types'
import { createBlankSections } from './template'

/**
 * Web Prototype — 개인 웹 프로토타입
 * 구조만 적용된 상태입니다. 실제 자료가 들어오면 섹션 단위로 채워주세요.
 */
export const webPrototype: CaseStudyData = {
  projectId: 'web-prototype',
  status: 'draft',
  accent: 'rose',

  hero: {
    tagline: pending('한 줄 소개'),
    media: {
      placeholder: '대표 목업 — 브라우저 화면',
      alt: '웹 프로토타입 대표 목업',
      aspect: '5 / 6',
      tone: 'ivory',
    },
    meta: {
      type: pending('프로젝트 유형'),
      role: pending('담당 역할'),
      period: pending('진행 기간'),
      tools: pending('사용 도구'),
    },
  },

  sections: createBlankSections(),
}
