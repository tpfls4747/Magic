import { useState, type CSSProperties } from 'react'
import { illustrations } from '../illustrations'
import type { MediaItem } from '../types'
import { Content, StatusTag } from './Text'

interface MediaFigureProps {
  item: MediaItem
  /** 기본 sizes 값 (블록 폭에 따라 상위에서 지정) */
  sizes?: string
  /** 첫 화면 이미지는 지연 로딩하지 않습니다 */
  priority?: boolean
  className?: string
}

/**
 * 이미지 · 콘셉트 시안 · 플레이스홀더를 같은 틀(비율 고정 프레임)로 보여주는 figure.
 * - 실제 이미지: srcset + lazy loading, 로딩 중에는 은은한 스켈레톤, 실패 시 안내
 * - 코드 시안: '콘셉트 시안' 표시
 * - 자료 없음: 넣어야 할 자료를 안내하는 플레이스홀더
 */
export function MediaFigure({ item, sizes, priority, className = '' }: MediaFigureProps) {
  const style = { '--cs-aspect': item.aspect ?? '16 / 10' } as CSSProperties
  const tone = item.tone ?? 'ivory'
  const Illustration = item.illustration ? illustrations[item.illustration] : undefined
  const isConcept = item.status === 'concept'

  return (
    <figure className={`cs-media ${className}`.trim()}>
      <div className={`cs-media__frame cs-media__frame--${tone}`} style={style}>
        {item.image ? (
          <ResponsiveImage item={item} sizes={sizes} priority={priority} />
        ) : Illustration ? (
          <div className="cs-media__illustration">
            <Illustration />
          </div>
        ) : (
          <Placeholder note={item.placeholder ?? item.alt} />
        )}
        {isConcept && (
          <span className="cs-media__badge">
            <StatusTag kind="concept" />
          </span>
        )}
      </div>
      {(item.caption || isConcept) && (
        <figcaption className="cs-media__caption">
          {item.caption && <Content value={item.caption} />}
          {isConcept && (
            <span className="cs-media__concept-note">
              코드로 그린 임시 시안입니다 · 화면 속 정보는 모두 예시
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}

function ResponsiveImage({ item, sizes, priority }: MediaFigureProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const sources = item.image!.sources
  const largest = sources.reduce((a, b) => (b.width > a.width ? b : a))
  const srcSet = sources.map((s) => `${s.src} ${s.width}w`).join(', ')

  if (state === 'error') {
    return <Placeholder note={`이미지를 불러오지 못했습니다 — ${item.alt}`} />
  }

  return (
    <>
      {state === 'loading' && <span className="cs-media__skeleton" aria-hidden="true" />}
      <img
        className={`cs-media__img ${state === 'loaded' ? 'is-loaded' : ''}`}
        src={largest.src}
        srcSet={srcSet}
        sizes={item.image!.sizes ?? sizes ?? '(min-width: 1100px) 760px, 100vw'}
        alt={item.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
      />
    </>
  )
}

function Placeholder({ note }: { note: string }) {
  return (
    <div className="cs-placeholder">
      <span className="cs-placeholder__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" strokeLinejoin="round" />
        </svg>
      </span>
      <StatusTag kind="pending" />
      <span className="cs-placeholder__note">{note}</span>
    </div>
  )
}
