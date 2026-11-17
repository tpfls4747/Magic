import { draft, pending, type CaseStudyData } from '../types'
import { createBlankSections } from './template'

/**
 * Sign-up Redesign — 회원가입 UX 리디자인
 * 구조만 적용된 상태입니다. 실제 자료가 들어오면 섹션 단위로 채워주세요.
 */
const blank = createBlankSections()

export const signupRedesign: CaseStudyData = {
  projectId: 'signup-redesign',
  status: 'draft',
  accent: 'champagne',

  hero: {
    tagline: draft('복잡한 가입 과정을, 이해하기 쉬운 단계로'),
    media: {
      placeholder: '대표 목업 — 개선 전 / 후 회원가입 화면',
      alt: '회원가입 화면 대표 목업',
      aspect: '5 / 6',
      tone: 'champagne',
    },
    meta: {
      type: 'UX Redesign · Usability',
      role: pending('담당 역할'),
      period: pending('진행 기간'),
      tools: pending('사용 도구'),
    },
  },

  sections: {
    ...blank,
    overview: {
      ...blank.overview,
      intro: draft(
        '복잡한 회원가입 과정을 분석하고, 사용자가 더 쉽게 이해하고 진행할 수 있도록 화면 구조와 입력 흐름을 개선한 UX 프로젝트입니다.',
      ),
    },
  },
}
