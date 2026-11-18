/**
 * Process — How I Create 모듈의 공개 API.
 * 메인 앱에서는 이 파일에서만 import 하세요.
 *
 *   import { ProcessSection } from '@/process'
 *   <ProcessSection id="process" />
 */
export { ProcessSection, type ProcessSectionProps } from './ProcessSection'
export { processContent } from './data/processContent'
export * from './types'
