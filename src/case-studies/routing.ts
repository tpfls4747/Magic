/** 독립 페이지에서 프로젝트를 고르는 쿼리 파라미터 */
export const PROJECT_PARAM = 'project'

/** 독립 Case Study 페이지 기준의 프로젝트 주소 (`?project=seat-swap`) */
export const caseStudyHref = (id: string) => `?${PROJECT_PARAM}=${encodeURIComponent(id)}`
