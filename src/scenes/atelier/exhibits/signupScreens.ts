import type * as THREE from 'three'
import { canvasTexture as texture, type Draw } from './uiCanvas'

// 기존 import 경로 유지
export { createCardShadowTexture } from './uiCanvas'

/**
 * Sign-up Redesign — 스마트폰 화면 UI (임시 데모)
 *
 * 실제 프로젝트 자료가 들어오기 전까지 사용하는 데모 화면입니다.
 * 성과 수치나 사용자 테스트 결과 같은 내용은 넣지 않습니다.
 *
 * 화면은 배경 1장 + 여러 UI 요소로 나뉘어 있고, 요소마다 별도의 텍스처를 가집니다.
 * 3D 장면에서 각 요소가 화면 위로 입체적으로 분리되었다가 다시 정렬될 수 있도록 하기 위해서입니다.
 * 좌표는 390 × 834 의 논리 픽셀(px, 좌상단 기준)로 정의합니다.
 */

export const SCREEN_PX = { width: 390, height: 834 } as const

export interface ScreenElement {
  /** 논리 픽셀 기준 위치·크기 */
  x: number
  y: number
  w: number
  h: number
  texture: THREE.CanvasTexture
  /** 카드형 요소(입력창·버튼 등) — 떠오를 때 화면에 그림자를 드리웁니다 */
  card: boolean
}

export interface ScreenState {
  background: THREE.CanvasTexture
  elements: ScreenElement[]
}


const SANS = 'system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif'

function element(
  x: number,
  y: number,
  w: number,
  h: number,
  draw: Draw,
  card = false,
): ScreenElement {
  return { x, y, w, h, card, texture: texture(w, h, 3, draw) }
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 400,
  align: CanvasTextAlign = 'left',
) {
  ctx.font = `${weight} ${size}px ${SANS}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(value, x, y)
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
  lineWidth = 1,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
}

/** 상태 표시줄 + 다이내믹 아일랜드 */
function statusBar(ctx: CanvasRenderingContext2D, color: string) {
  text(ctx, '9:41', 44, 27, 15, color, 600, 'center')
  // 신호
  ctx.fillStyle = color
  for (let i = 0; i < 4; i++) ctx.fillRect(300 + i * 5, 31 - i * 3 - 3, 3, 3 + i * 3)
  // 배터리
  box(ctx, 328, 21, 24, 12, 3.5, undefined, color, 1)
  box(ctx, 330, 23, 17, 8, 2, color)
  ctx.fillRect(353.5, 25, 1.6, 4)
  // 다이내믹 아일랜드
  box(ctx, 140, 11, 110, 32, 16, '#0d0b10')
}

// ─────────────────────────────────────────────
// 기존 회원가입 화면 — 한 화면에 모든 입력 항목이 빽빽하게 나열된 구성
// ─────────────────────────────────────────────

const OLD_FIELDS: { label: string; placeholder: string; action?: string }[] = [
  { label: '아이디 *', placeholder: '영문, 숫자 6~12자', action: '중복확인' },
  { label: '비밀번호 *', placeholder: '영문, 숫자, 특수문자 조합 8자 이상' },
  { label: '비밀번호 확인 *', placeholder: '비밀번호를 다시 입력하세요' },
  { label: '이름 *', placeholder: '' },
  { label: '생년월일 *', placeholder: 'YYYYMMDD' },
  { label: '휴대폰 번호 *', placeholder: "'-' 없이 입력", action: '인증요청' },
  { label: '이메일 *', placeholder: '' },
  { label: '주소', placeholder: '' },
]

function createBefore(): ScreenState {
  const background = texture(SCREEN_PX.width, SCREEN_PX.height, 2, (ctx, w, h) => {
    ctx.fillStyle = '#f1f1f1'
    ctx.fillRect(0, 0, w, h)
    statusBar(ctx, '#222222')
  })

  const elements: ScreenElement[] = []

  elements.push(
    element(0, 52, 390, 48, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#dddddd'
      ctx.fillRect(0, h - 1, w, 1)
      text(ctx, '‹', 20, h / 2, 26, '#444444')
      text(ctx, '회원가입', w / 2, h / 2, 16, '#333333', 600, 'center')
    }, true),
  )

  elements.push(
    element(16, 108, 358, 22, (ctx, _w, h) => {
      text(ctx, '* 표시는 필수 입력 항목입니다.', 0, h / 2, 11, '#b8665a')
    }),
  )

  OLD_FIELDS.forEach((f, i) => {
    elements.push(
      element(16, 136 + i * 60, 358, 54, (ctx, w) => {
        text(ctx, f.label, 0, 9, 12, '#555555', 500)
        const inputW = f.action ? w - 78 : w
        box(ctx, 0, 20, inputW, 32, 2, '#ffffff', '#c9c9c9')
        if (f.placeholder) text(ctx, f.placeholder, 10, 36, 11.5, '#aaaaaa')
        if (f.action) {
          box(ctx, w - 72, 20, 72, 32, 2, '#e4e4e4', '#c9c9c9')
          text(ctx, f.action, w - 36, 36, 11.5, '#555555', 500, 'center')
        }
      }, true),
    )
  })

  elements.push(
    element(16, 624, 358, 92, (ctx, w) => {
      box(ctx, 0.5, 0.5, w - 1, 91, 2, '#ffffff', '#d5d5d5')
      const lines = [
        ['전체 동의합니다', 600],
        ['[필수] 이용약관 동의  (보기)', 400],
        ['[필수] 개인정보 수집 및 이용 동의  (보기)', 400],
        ['[선택] 마케팅 정보 수신 동의', 400],
      ] as const
      lines.forEach(([label, weight], i) => {
        const y = 16 + i * 20
        box(ctx, 12, y - 6, 12, 12, 1, '#ffffff', '#aaaaaa')
        text(ctx, label, 32, y, 11, '#555555', weight)
      })
    }, true),
  )

  elements.push(
    element(16, 730, 358, 46, (ctx, w, h) => {
      box(ctx, 0, 0, w, h, 3, '#9aa0a8')
      text(ctx, '가입하기', w / 2, h / 2, 15, '#ffffff', 600, 'center')
    }, true),
  )

  return { background, elements }
}

// ─────────────────────────────────────────────
// 개선된 회원가입 화면 — 단계별로 한 가지씩 묻는 구성 (데모)
// ─────────────────────────────────────────────

const INK = '#2f2836'
const LAVENDER = '#7f6cb3'
const LAVENDER_LINE = '#a896d8'

function createAfter(): ScreenState {
  const background = texture(SCREEN_PX.width, SCREEN_PX.height, 2, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#f3eef8')
    g.addColorStop(0.35, '#faf7f1')
    g.addColorStop(1, '#fbf8f2')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // 오른쪽 위의 은은한 라벤더 빛
    const glow = ctx.createRadialGradient(w * 0.85, 90, 0, w * 0.85, 90, 260)
    glow.addColorStop(0, 'rgba(201, 186, 236, 0.45)')
    glow.addColorStop(1, 'rgba(201, 186, 236, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    statusBar(ctx, INK)
  })

  const elements: ScreenElement[] = []

  // 상단: 뒤로가기 + 단계 표시
  elements.push(
    element(20, 56, 350, 44, (ctx, w) => {
      text(ctx, '‹', 4, 16, 28, INK)
      text(ctx, '1 / 3', w - 2, 17, 13, LAVENDER, 600, 'right')
      const seg = (w - 16) / 3
      for (let i = 0; i < 3; i++) {
        box(ctx, i * (seg + 8), 38, seg, 4, 2, i === 0 ? LAVENDER : 'rgba(127, 108, 179, 0.18)')
      }
    }),
  )

  elements.push(
    element(24, 124, 342, 88, (ctx) => {
      text(ctx, '이메일로', 0, 22, 28, INK, 700)
      text(ctx, '간편하게 시작하세요', 0, 62, 28, INK, 700)
    }),
  )

  elements.push(
    element(24, 218, 342, 24, (ctx, _w, h) => {
      text(ctx, '필요한 정보만 단계별로 입력해요', 0, h / 2, 14, '#7a7080')
    }),
  )

  // 입력창 (포커스 상태)
  elements.push(
    element(24, 268, 342, 70, (ctx, w) => {
      text(ctx, '이메일', 4, 9, 12, LAVENDER, 600)
      box(ctx, 1, 20, w - 2, 48, 14, '#ffffff', LAVENDER_LINE, 1.6)
      text(ctx, 'hello@unlock.world', 18, 44, 16, INK, 500)
      ctx.fillStyle = LAVENDER
      ctx.fillRect(176, 34, 1.6, 20)
    }, true),
  )

  // 실시간 안내 문구
  elements.push(
    element(24, 344, 342, 22, (ctx, _w, h) => {
      ctx.beginPath()
      ctx.arc(10, h / 2, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(127, 108, 179, 0.16)'
      ctx.fill()
      ctx.strokeStyle = LAVENDER
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(6, h / 2)
      ctx.lineTo(9, h / 2 + 3)
      ctx.lineTo(14, h / 2 - 3)
      ctx.stroke()
      text(ctx, '올바른 이메일 형식이에요', 26, h / 2, 12, LAVENDER, 500)
    }),
  )

  // 주요 버튼
  elements.push(
    element(24, 646, 342, 56, (ctx, w, h) => {
      box(ctx, 0, 0, w, h, 28, INK)
      text(ctx, '다음', w / 2, h / 2, 16, '#ffffff', 600, 'center')
    }, true),
  )

  elements.push(
    element(24, 716, 342, 20, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(47, 40, 54, 0.14)'
      ctx.fillRect(0, h / 2, w / 2 - 28, 1)
      ctx.fillRect(w / 2 + 28, h / 2, w / 2 - 28, 1)
      text(ctx, '또는', w / 2, h / 2, 12, '#8a8090', 400, 'center')
    }),
  )

  elements.push(
    element(24, 746, 342, 52, (ctx, w, h) => {
      box(ctx, 0.8, 0.8, w - 1.6, h - 1.6, 26, '#ffffff', '#ddd3ef', 1.4)
      text(ctx, 'SNS 계정으로 계속하기', w / 2, h / 2, 14, INK, 500, 'center')
    }, true),
  )

  return { background, elements }
}

export interface SignupScreens {
  before: ScreenState
  after: ScreenState
  dispose: () => void
}

export function createSignupScreens(): SignupScreens {
  const before = createBefore()
  const after = createAfter()
  return {
    before,
    after,
    dispose: () => {
      for (const s of [before, after]) {
        s.background.dispose()
        s.elements.forEach((e) => e.texture.dispose())
      }
    },
  }
}
