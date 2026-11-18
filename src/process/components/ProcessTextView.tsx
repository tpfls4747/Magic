import { forwardRef } from 'react'
import type { ProcessContent } from '../types'
import { TextValue } from './TextValue'

/** 3D 없이 다섯 단계를 HTML 로 읽는 영역 (WebGL 미지원 시 기본 표시) */
export const ProcessTextView = forwardRef<HTMLDivElement, { content: ProcessContent; id: string }>(
  function ProcessTextView({ content, id }, ref) {
    return (
      <div ref={ref} id={id} className="pr-textview" tabIndex={-1} aria-labelledby={`${id}-title`}>
        <div className="pr-textview__inner">
          <p className="pr-eyebrow">How I Create · Text</p>
          <h3 id={`${id}-title`} className="pr-textview__title">
            다섯 단계로 보는 디자인 과정
          </h3>
          <p className="pr-textview__note">{content.note}</p>
          <ol className="pr-textview__list">
            {content.stages.map((s) => (
              <li key={s.id} className="pr-textview__stage">
                <p className="pr-textview__num">{s.number}</p>
                <div>
                  <h4 className="pr-textview__stage-title">
                    {s.title} <span>{s.label}</span>
                  </h4>
                  <p className="pr-textview__purpose">
                    <TextValue value={s.purpose} />
                  </p>
                  <dl className="pr-textview__meta">
                    <div>
                      <dt>일반적인 방법</dt>
                      <dd>{s.methods.join(' · ')}</dd>
                    </div>
                    <div>
                      <dt>대표 산출물</dt>
                      <dd>{s.deliverables.join(' · ')}</dd>
                    </div>
                    <div>
                      <dt>실제 사례</dt>
                      <dd>
                        {s.examples.map((ex, i) => (
                          <TextValue key={i} value={ex} />
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  },
)
