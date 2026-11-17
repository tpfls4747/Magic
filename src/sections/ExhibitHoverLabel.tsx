import { useEffect, useRef } from 'react'
import { getProject } from '@/data/projects'
import { useHoveredProject } from '@/lib/tour'
import './ExhibitHoverLabel.css'

/**
 * 전시관 전체 화면에서 3D 작품 위에 마우스를 올리면 커서 옆에 작품 이름을 보여줍니다.
 * 클릭하면 근접 화면으로 이동한다는 것을 알려주는 안내입니다. (작품 앞에서는 표시하지 않음)
 */
export function ExhibitHoverLabel() {
  const id = useHoveredProject()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !ref.current) return
      ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const project = id ? getProject(id) : undefined
  return (
    <div ref={ref} className="exhibit-hover-label" data-visible={Boolean(project)} aria-hidden="true">
      {project && (
        <>
          <span className="exhibit-hover-label__no">{String(project.index).padStart(2, '0')}</span>
          {project.title}
          <span className="exhibit-hover-label__cta">보기 →</span>
        </>
      )}
    </div>
  )
}
