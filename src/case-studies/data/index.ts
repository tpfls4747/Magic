import { projects } from '@/data/projects'
import type { CaseStudyData, ResolvedCaseStudy } from '../types'
import { seatSwap } from './seat-swap'
import { signupRedesign } from './signup-redesign'
import { webPrototype } from './web-prototype'

/**
 * Case Study 레지스트리.
 * 새 프로젝트 추가: data/ 에 파일을 만들고 이 배열에 넣기만 하면 됩니다.
 * 순서는 전시관(`src/data/projects.ts`)의 index 순서를 따릅니다.
 */
const registry: CaseStudyData[] = [seatSwap, signupRedesign, webPrototype]

/** 전시관 프로젝트 정보(제목·부제·번호·태그)와 상세 데이터를 합칩니다 */
export const caseStudies: ResolvedCaseStudy[] = registry
  .flatMap((data) => {
    const project = projects.find((p) => p.id === data.projectId)
    if (!project) {
      if (import.meta.env.DEV) {
        console.warn(`[case-studies] projects.ts 에 '${data.projectId}' 프로젝트가 없습니다.`)
      }
      return []
    }
    return [
      {
        ...data,
        id: project.id,
        index: project.index,
        title: project.title,
        subtitle: project.subtitle,
        tags: project.tags,
      },
    ]
  })
  .sort((a, b) => a.index - b.index)

export const getCaseStudy = (id: string) => caseStudies.find((c) => c.id === id)

/** 이전 / 다음 프로젝트 (처음과 끝은 서로 이어집니다) */
export function getAdjacentCaseStudies(id: string) {
  const i = caseStudies.findIndex((c) => c.id === id)
  const n = caseStudies.length
  if (i < 0 || n < 2) return { prev: undefined, next: undefined }
  return {
    prev: caseStudies[(i - 1 + n) % n],
    next: caseStudies[(i + 1) % n],
  }
}
