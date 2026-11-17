import { useEffect, useState, type RefObject } from 'react'

/** 요소가 화면 근처에 있는지 — 보이지 않을 때 3D 렌더링을 멈추기 위해 */
export function useInView(ref: RefObject<Element | null>, rootMargin = '200px 0px') {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}

let webglSupport: boolean | null = null

/** WebGL 사용 가능 여부 (한 번만 검사) */
export function hasWebGL() {
  if (webglSupport !== null) return webglSupport
  try {
    const c = document.createElement('canvas')
    webglSupport = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}
