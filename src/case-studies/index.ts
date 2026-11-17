/**
 * Case Study 모듈의 공개 API.
 * 메인 앱에서는 이 파일에서만 import 하세요.
 *
 *   import { CaseStudyPage, getCaseStudy, getAdjacentCaseStudies, caseStudies } from '@/case-studies'
 */
export { CaseStudyApp } from './CaseStudyApp'
export { caseStudyHref, PROJECT_PARAM } from './routing'
export { CaseStudyPage, type CaseStudyPageProps } from './components/CaseStudyPage'
export { caseStudies, getAdjacentCaseStudies, getCaseStudy } from './data'
export { createBlankSections } from './data/template'
export { SECTION_META } from './sections'
export * from './types'
