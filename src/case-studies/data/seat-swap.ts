import { draft, pending, type CaseStudyData } from '../types'

/**
 * Seat Swap — 공연 좌석 교환 UX
 *
 * ⚠️ 현재 실제 프로젝트 자료(조사 결과, 화면 시안, 기간·역할 등)가 없습니다.
 *    - draft()   : 방향을 보여주기 위한 임시 문구 / 가설 (화면에 '임시' 표시)
 *    - pending() : 실제 자료로 채워야 하는 자리 (화면에 '자료 필요' 표시)
 *    - status: 'concept' 목업 : 코드로 그린 콘셉트 시안 (실제 디자인 아님)
 *    실제 자료가 준비되면 해당 값을 일반 문자열 / 이미지로 교체하세요.
 */
export const seatSwap: CaseStudyData = {
  projectId: 'seat-swap',
  status: 'draft',
  accent: 'lavender',

  hero: {
    tagline: draft('예매한 공연 좌석을, 다른 관객과 안심하고 맞바꾸는 경험'),
    media: {
      illustration: 'seat-swap/hero',
      alt: '좌석 배치도에서 두 좌석이 서로 교환되는 모습을 보여주는 스마트폰 화면과 두 장의 티켓 콘셉트 이미지',
      status: 'concept',
      aspect: '5 / 6',
      tone: 'lavender',
    },
    meta: {
      type: 'UX Design · Mobile',
      role: pending('담당 역할 (예: UX 리서치, UI 디자인)'),
      period: pending('진행 기간 (예: 2025.03 – 2025.05, 6주)'),
      tools: pending('사용 도구 (예: Figma, FigJam)'),
    },
  },

  sections: {
    overview: {
      intro: draft(
        '예매한 공연 좌석을 다른 관객과 맞바꾸는 과정을 더 쉽고 안심할 수 있게 설계한 UX 프로젝트입니다.',
      ),
      subsections: [
        {
          heading: '프로젝트 배경',
          kicker: 'Background',
          blocks: [
            {
              type: 'prose',
              paragraphs: [
                pending(
                  '프로젝트를 시작하게 된 실제 계기와 맥락 — 어떤 상황에서 좌석 교환이 필요해지는지, 왜 이 문제를 선택했는지',
                ),
              ],
            },
          ],
        },
        {
          heading: '작업 범위',
          kicker: 'Scope',
          blocks: [
            {
              type: 'facts',
              items: [
                { label: '플랫폼', value: pending('대상 플랫폼 (예: 모바일 앱)') },
                { label: '범위', value: pending('담당한 단계 (예: 리서치 → UI 디자인 → 프로토타입)') },
                { label: '형태', value: pending('개인 / 팀 프로젝트 여부와 구성') },
                { label: '산출물', value: pending('최종 산출물 목록') },
              ],
            },
          ],
        },
        {
          heading: '핵심 목표',
          kicker: 'Goals',
          blocks: [
            {
              type: 'cards',
              variant: 'numbered',
              items: [
                {
                  title: draft('쉽게'),
                  body: draft('교환을 원하는 좌석을 고르고 요청하기까지의 과정을 짧고 명확하게 만든다.'),
                },
                {
                  title: draft('안심하고'),
                  body: draft('교환 전후의 좌석 정보와 진행 상태를 언제든 확인할 수 있게 한다.'),
                },
                {
                  title: draft('확실하게'),
                  body: draft('교환이 확정되기 전 최종 내용을 다시 확인하고, 완료 후 결과를 분명히 보여준다.'),
                },
              ],
            },
          ],
        },
      ],
    },

    problem: {
      intro: pending('해결하려는 문제를 한두 문장으로 요약'),
      subsections: [
        {
          heading: '기존 경험의 불편함',
          kicker: 'Pain Points',
          blocks: [
            {
              type: 'cards',
              items: [
                {
                  label: '가설',
                  title: draft('교환 상대를 찾기 어렵다'),
                  body: pending('조사로 확인한 실제 근거로 교체'),
                },
                {
                  label: '가설',
                  title: draft('좌석 정보를 믿기 어렵다'),
                  body: pending('조사로 확인한 실제 근거로 교체'),
                },
                {
                  label: '가설',
                  title: draft('진행 상황이 보이지 않는다'),
                  body: pending('조사로 확인한 실제 근거로 교체'),
                },
              ],
            },
          ],
        },
        {
          heading: '문제 정의',
          kicker: 'Problem Statement',
          blocks: [
            {
              type: 'statement',
              label: 'How Might We',
              text: draft('어떻게 하면 관객이 예매한 좌석을, 불안 없이 다른 관객과 맞바꿀 수 있을까?'),
            },
          ],
        },
      ],
    },

    research: {
      intro: pending('조사 목적과 방법을 한두 문장으로 요약'),
      subsections: [
        {
          heading: '조사 개요',
          kicker: 'Method',
          blocks: [
            {
              type: 'facts',
              items: [
                { label: '조사 방법', value: pending('예: 심층 인터뷰, 설문, 경쟁 서비스 분석') },
                { label: '참여자', value: pending('실제 참여자 수와 조건') },
                { label: '기간', value: pending('조사 기간') },
              ],
            },
            {
              type: 'media',
              width: 'wide',
              item: {
                placeholder: '실제 조사 자료 — 인터뷰 노트, 설문 결과, 어피니티 다이어그램 등의 이미지',
                alt: '사용자 조사 자료',
                aspect: '16 / 9',
              },
            },
          ],
        },
        {
          heading: '인사이트',
          kicker: 'Insights',
          blocks: [
            {
              type: 'cards',
              variant: 'numbered',
              items: [
                { title: pending('인사이트 1'), body: pending('근거가 된 조사 내용') },
                { title: pending('인사이트 2'), body: pending('근거가 된 조사 내용') },
                { title: pending('인사이트 3'), body: pending('근거가 된 조사 내용') },
              ],
            },
          ],
        },
        {
          heading: '사용자 흐름과 페인포인트',
          kicker: 'Journey',
          blocks: [
            {
              type: 'flow',
              status: 'draft',
              steps: [
                { title: '공연 예매', pain: pending('이 단계의 페인포인트') },
                { title: '일정 · 동행 변경', pain: pending('이 단계의 페인포인트') },
                { title: '교환 상대 찾기', pain: pending('이 단계의 페인포인트') },
                { title: '조건 확인 · 협의', pain: pending('이 단계의 페인포인트') },
                { title: '좌석 교환', pain: pending('이 단계의 페인포인트') },
              ],
            },
          ],
        },
      ],
    },

    solution: {
      intro: pending('인사이트에서 해결안으로 이어지는 핵심 전략 요약'),
      subsections: [
        {
          heading: '정보 구조 개선',
          kicker: 'Information Architecture',
          blocks: [
            {
              type: 'media',
              width: 'wide',
              item: {
                placeholder: '정보 구조(IA) 다이어그램 — 개선 전 / 후',
                alt: '정보 구조 다이어그램',
                aspect: '16 / 9',
              },
            },
            {
              type: 'prose',
              paragraphs: [pending('정보 구조를 어떻게, 왜 바꾸었는지 설명')],
            },
          ],
        },
        {
          heading: 'User Flow',
          kicker: 'Flow',
          blocks: [
            {
              type: 'flow',
              status: 'draft',
              steps: [
                { title: '예매 내역에서 좌석 선택', note: draft('교환할 티켓을 고른다') },
                { title: '희망 조건 설정', note: draft('원하는 구역 · 좌석 조건') },
                { title: '교환 후보 확인', note: draft('후보 좌석을 배치도에서 비교') },
                { title: '요청 · 수락', note: draft('양쪽이 모두 동의해야 진행') },
                { title: '새 티켓 확인', note: draft('교환 결과를 티켓에 반영') },
              ],
            },
          ],
        },
        {
          heading: 'Wireframe',
          kicker: 'Low Fidelity',
          blocks: [
            {
              type: 'gallery',
              columns: 3,
              items: [
                { placeholder: '와이어프레임 — 좌석 선택', alt: '와이어프레임 1', aspect: '3 / 4' },
                { placeholder: '와이어프레임 — 교환 후보', alt: '와이어프레임 2', aspect: '3 / 4' },
                { placeholder: '와이어프레임 — 교환 확정', alt: '와이어프레임 3', aspect: '3 / 4' },
              ],
            },
          ],
        },
        {
          heading: 'UI 디자인',
          kicker: 'Visual Design',
          blocks: [
            {
              type: 'gallery',
              columns: 3,
              items: [
                {
                  illustration: 'seat-swap/screen-seat-map',
                  alt: '좌석 배치도에서 교환할 좌석과 후보 좌석을 표시한 콘셉트 화면',
                  caption: draft('좌석 배치도 위에서 내 좌석과 교환 후보를 함께 보여준다'),
                  status: 'concept',
                  aspect: '9 / 16',
                  tone: 'ivory',
                },
                {
                  illustration: 'seat-swap/screen-request',
                  alt: '현재 좌석과 교환할 좌석을 나란히 비교하는 교환 요청 콘셉트 화면',
                  caption: draft('바뀌는 내용을 나란히 비교한 뒤 요청한다'),
                  status: 'concept',
                  aspect: '9 / 16',
                  tone: 'lavender',
                },
                {
                  illustration: 'seat-swap/screen-confirm',
                  alt: '교환이 완료되어 새 좌석이 반영된 티켓을 보여주는 콘셉트 화면',
                  caption: draft('완료 후 새 좌석이 반영된 티켓을 바로 확인한다'),
                  status: 'concept',
                  aspect: '9 / 16',
                  tone: 'champagne',
                },
              ],
            },
          ],
        },
        {
          heading: '주요 인터랙션',
          kicker: 'Interaction',
          blocks: [
            {
              type: 'cards',
              columns: 3,
              items: [
                {
                  label: 'Seat Highlight',
                  title: draft('좌석 하이라이트'),
                  body: pending('인터랙션 의도와 동작 설명 / GIF'),
                },
                {
                  label: 'Swap Preview',
                  title: draft('교환 미리보기'),
                  body: pending('인터랙션 의도와 동작 설명 / GIF'),
                },
                {
                  label: 'Status Tracking',
                  title: draft('진행 상태 확인'),
                  body: pending('인터랙션 의도와 동작 설명 / GIF'),
                },
              ],
            },
          ],
        },
      ],
    },

    prototype: {
      intro: pending('최종 프로토타입 소개 — 무엇을 확인할 수 있는지'),
      subsections: [
        {
          heading: '최종 UI',
          kicker: 'Final Mockup',
          blocks: [
            {
              type: 'media',
              width: 'full',
              item: {
                placeholder: '최종 UI 목업 — 주요 화면을 모은 대표 이미지',
                alt: '최종 UI 목업',
                aspect: '21 / 9',
                tone: 'champagne',
              },
            },
          ],
        },
        {
          heading: '인터랙티브 프로토타입',
          kicker: 'Try It',
          blocks: [
            {
              type: 'links',
              items: [
                {
                  label: 'Live Demo',
                  variant: 'primary',
                  description: pending('라이브 데모 주소'),
                },
                {
                  label: 'Figma Prototype',
                  variant: 'secondary',
                  description: pending('Figma 프로토타입 공유 링크'),
                },
              ],
            },
          ],
        },
      ],
    },

    reflection: {
      subsections: [
        {
          heading: '설계 과정에서 배운 점',
          kicker: 'Learnings',
          blocks: [
            {
              type: 'prose',
              paragraphs: [pending('프로젝트를 진행하며 실제로 배운 점')],
            },
          ],
        },
        {
          heading: '한계와 향후 개선 방향',
          kicker: 'Next Steps',
          blocks: [
            {
              type: 'list',
              items: [pending('현재 설계의 한계'), pending('다음에 개선하고 싶은 방향')],
            },
          ],
        },
      ],
    },
  },
}
