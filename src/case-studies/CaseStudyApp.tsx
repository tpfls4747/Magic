import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { CaseStudyPage } from './components/CaseStudyPage'
import { caseStudies, getAdjacentCaseStudies, getCaseStudy } from './data'
import { caseStudyHref, PROJECT_PARAM } from './routing'

const readId = () => new URLSearchParams(window.location.search).get(PROJECT_PARAM) ?? caseStudies[0]?.id

/**
 * 라우터 없이 단독으로 동작하는 Case Study 앱.
 * `?project=seat-swap` 쿼리로 프로젝트를 고르고, 이전/다음 이동은 history API 로 처리합니다.
 * (독립 미리보기 페이지와, 메인 앱에 라우터가 없을 때의 별도 페이지로 사용)
 */
export function CaseStudyApp({ exhibitionHref = '/' }: { exhibitionHref?: string }) {
  const [id, setId] = useState(readId)
  const study = (id && getCaseStudy(id)) || caseStudies[0]

  useEffect(() => {
    const onPop = () => setId(readId())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (study) document.title = `${study.title} — Case Study · Unlock My World`
  }, [study])

  const navigate = useCallback((nextId: string, e: MouseEvent<HTMLAnchorElement>) => {
    // 새 탭 열기 등 보조 클릭은 브라우저 기본 동작에 맡김
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    window.history.pushState(null, '', caseStudyHref(nextId))
    setId(nextId)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  if (!study) return null
  const { prev, next } = getAdjacentCaseStudies(study.id)

  return (
    <CaseStudyPage
      key={study.id}
      study={study}
      total={caseStudies.length}
      prev={prev}
      next={next}
      exhibitionHref={exhibitionHref}
      getProjectHref={caseStudyHref}
      onNavigateProject={navigate}
    />
  )
}
