import { useEffect, useRef, useState } from 'react'

/**
 * 요소가 화면에 들어오면 한 번 true 가 됩니다 (섹션 등장 애니메이션용).
 * 애니메이션 감소 설정은 CSS 에서 처리하므로 여기서는 관찰만 합니다.
 */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || revealed) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  return { ref, revealed }
}
