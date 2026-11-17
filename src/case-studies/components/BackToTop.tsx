import { sectionDomId } from '../sections'

/** 맨 위로 이동 — 히어로를 지나면 나타납니다. 이동 후 포커스는 페이지 첫 부분으로 옮깁니다. */
export function BackToTop({ visible }: { visible: boolean }) {
  const onClick = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    const hero = document.getElementById(sectionDomId('hero'))
    hero?.focus({ preventScroll: true })
  }
  return (
    <button
      type="button"
      className={`cs-totop ${visible ? 'is-visible' : ''}`}
      onClick={onClick}
      aria-label="맨 위로 이동"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
