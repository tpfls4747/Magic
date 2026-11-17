import type * as THREE from 'three'
import { canvasTexture, type Draw } from './uiCanvas'

/**
 * Web Prototype — 브라우저 화면 콘텐츠 (임시 데모)
 *
 * 실제 웹 프로젝트가 정해지기 전까지 사용하는 데모 랜딩 페이지입니다.
 * 성과·사용자 조사·클라이언트 이름 같은 확인되지 않은 내용은 넣지 않습니다.
 *
 * 실제 작업물로 바꿀 때는 이 파일만 교체하면 됩니다.
 * - 배경 1장 + UI 레이어 여러 장(요소별 텍스처)
 * - 각 레이어의 펼쳐짐(깊이·방향)도 여기서 데이터로 정합니다. 3D 모델은 그대로 둡니다.
 * 좌표는 1280 × 754 논리 픽셀(좌상단 기준) — 화면 영역 비율과 같습니다.
 */

export const PAGE_PX = { width: 1280, height: 754 } as const

export interface PageLayer {
  name: string
  x: number
  y: number
  w: number
  h: number
  /** hover 때 살짝 떠오르는 깊이 (m) */
  hoverDepth: number
  /** 클릭으로 펼쳤을 때의 깊이 (m) */
  openDepth: number
  /** 펼쳤을 때 화면 평면에서 비켜나는 방향 (m) */
  spread: [number, number]
  /** 떠오를 때 화면에 그림자를 드리울지 — 바탕이 있는 카드형 레이어만 (글자만 있는 레이어는 false) */
  shadow: boolean
  texture: THREE.CanvasTexture
}

export interface PageContent {
  background: THREE.CanvasTexture
  layers: PageLayer[]
  dispose: () => void
}

const SANS = 'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", sans-serif'
const SERIF = '"Cormorant Garamond", "Times New Roman", serif'
const INK = '#2f2836'
const MUTED = '#8a8090'
const LAVENDER = '#7f6cb3'
const GOLD = '#b0904f'

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'left',
  spacing = 0,
) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${spacing}px`
  ctx.fillText(value, x, y)
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** 회색 막대로 표현한 본문 자리 (실제 문구 대신) */
function lines(ctx: CanvasRenderingContext2D, x: number, y: number, widths: number[], gap = 16) {
  ctx.fillStyle = 'rgba(47, 40, 54, 0.12)'
  widths.forEach((w, i) => {
    rr(ctx, x, y + i * gap, w, 7, 3.5)
    ctx.fill()
  })
}

/** 레이어를 감싸는 카드 바탕 (반투명 아이보리 + 가는 테두리) */
function card(ctx: CanvasRenderingContext2D, w: number, h: number, r = 18) {
  rr(ctx, 1, 1, w - 2, h - 2, r)
  ctx.fillStyle = '#fffdf9'
  ctx.fill()
  ctx.strokeStyle = 'rgba(176, 144, 79, 0.28)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

interface LayerSpec extends Omit<PageLayer, 'texture'> {
  draw: Draw
}

const CARD_TOPICS = [
  { title: 'Components', icon: '◇' },
  { title: 'Motion', icon: '◌' },
  { title: 'Responsive', icon: '▭' },
]

const LAYERS: LayerSpec[] = [
  {
    name: 'navigation',
    x: 0,
    y: 0,
    w: 1280,
    h: 64,
    hoverDepth: 0.03,
    openDepth: 0.36,
    spread: [0, 0.05],
    shadow: true,
    draw: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 253, 249, 0.96)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(176, 144, 79, 0.3)'
      ctx.fillRect(0, h - 1.5, w, 1.5)
      text(ctx, '◆', 56, 41, `400 18px ${SANS}`, GOLD)
      text(ctx, 'Prototype', 82, 42, `italic 400 26px ${SERIF}`, INK)
      ;['Work', 'Studio', 'Journal', 'Contact'].forEach((label, i) =>
        text(ctx, label, 640 + i * 110, 40, `500 14px ${SANS}`, MUTED, 'left', 1),
      )
      rr(ctx, w - 176, 15, 120, 34, 17)
      ctx.fillStyle = INK
      ctx.fill()
      text(ctx, 'Get started', w - 116, 37, `500 13px ${SANS}`, '#ffffff', 'center')
    },
  },
  {
    name: 'hero',
    x: 64,
    y: 112,
    w: 560,
    h: 236,
    hoverDepth: 0.045,
    openDepth: 0.3,
    spread: [-0.03, 0.02],
    shadow: false,
    draw: (ctx) => {
      text(ctx, 'A LIVING INTERFACE', 2, 22, `600 13px ${SANS}`, LAVENDER, 'left', 4)
      text(ctx, 'Design that', 0, 100, `400 72px ${SERIF}`, INK)
      text(ctx, 'breathes.', 0, 172, `italic 400 72px ${SERIF}`, GOLD)
      text(ctx, '재사용 가능한 컴포넌트로 구성한 랜딩 페이지 프로토타입', 2, 222, `400 17px ${SANS}`, MUTED)
    },
  },
  {
    name: 'cta',
    x: 64,
    y: 368,
    w: 380,
    h: 54,
    hoverDepth: 0.06,
    openDepth: 0.46,
    spread: [-0.05, -0.01],
    shadow: true,
    draw: (ctx) => {
      rr(ctx, 0, 0, 222, 54, 27)
      ctx.fillStyle = INK
      ctx.fill()
      text(ctx, 'Explore prototype  →', 111, 33, `500 15px ${SANS}`, '#ffffff', 'center')
      text(ctx, 'View components', 252, 33, `500 15px ${SANS}`, INK)
      ctx.fillStyle = 'rgba(47, 40, 54, 0.35)'
      ctx.fillRect(252, 40, 122, 1.2)
    },
  },
  {
    name: 'image',
    x: 676,
    y: 96,
    w: 540,
    h: 326,
    hoverDepth: 0.035,
    openDepth: 0.2,
    spread: [0.05, 0.03],
    shadow: true,
    draw: (ctx, w, h) => {
      // 이미지 자리: 라벤더 → 샴페인 그라데이션 위의 아치 실루엣
      rr(ctx, 0, 0, w, h, 22)
      ctx.save()
      ctx.clip()
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#d9cdef')
      g.addColorStop(0.55, '#efe3d6')
      g.addColorStop(1, '#e6d0a6')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255, 253, 249, 0.55)'
      for (const [cx, aw, ah] of [
        [150, 110, 220],
        [290, 140, 270],
        [430, 110, 220],
      ]) {
        ctx.beginPath()
        ctx.moveTo(cx - aw / 2, h)
        ctx.lineTo(cx - aw / 2, h - ah + aw / 2)
        ctx.arc(cx, h - ah + aw / 2, aw / 2, Math.PI, 0)
        ctx.lineTo(cx + aw / 2, h)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(w - 78, 70, 28, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 253, 249, 0.8)'
      ctx.fill()
      ctx.restore()
      rr(ctx, 18, h - 44, 74, 26, 13)
      ctx.fillStyle = 'rgba(255, 253, 249, 0.85)'
      ctx.fill()
      text(ctx, 'IMAGE', 55, h - 26, `600 11px ${SANS}`, MUTED, 'center', 2)
    },
  },
  ...CARD_TOPICS.map<LayerSpec>((topic, i) => ({
    name: `card-${i + 1}`,
    x: 64 + i * 392,
    y: 452,
    w: 368,
    h: 178,
    hoverDepth: 0.02 + i * 0.008,
    openDepth: 0.12 + i * 0.06,
    spread: [(i - 1) * 0.06, -0.015],
    shadow: true,
    draw: (ctx, w, h) => {
      card(ctx, w, h)
      ctx.beginPath()
      ctx.arc(46, 48, 22, 0, Math.PI * 2)
      ctx.fillStyle = i === 1 ? 'rgba(127, 108, 179, 0.16)' : 'rgba(176, 144, 79, 0.16)'
      ctx.fill()
      text(ctx, topic.icon, 46, 56, `400 20px ${SANS}`, i === 1 ? LAVENDER : GOLD, 'center')
      text(ctx, topic.title, 28, 104, `400 28px ${SERIF}`, INK)
      lines(ctx, 28, 124, [w - 80, w - 130])
    },
  })),
  {
    name: 'footer',
    x: 0,
    y: 664,
    w: 1280,
    h: 90,
    hoverDepth: 0.015,
    openDepth: 0.08,
    spread: [0, -0.05],
    shadow: true,
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#efe7dc'
      ctx.fillRect(0, 0, w, h)
      text(ctx, 'Prototype', 64, 52, `italic 400 22px ${SERIF}`, INK)
      ;[0, 1, 2].forEach((c) => lines(ctx, 520 + c * 220, 34, [120, 84], 18))
      text(ctx, 'Demo layout', w - 64, 52, `500 12px ${SANS}`, MUTED, 'right', 2)
    },
  },
]

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#fbf8f2')
  g.addColorStop(1, '#f5efe6')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // 레이어가 떠나간 자리에 남는 옅은 그리드 — 펼쳤을 때 '구조'가 보이도록
  ctx.strokeStyle = 'rgba(127, 108, 179, 0.1)'
  ctx.lineWidth = 1
  for (let x = 64; x < w; x += 96) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = 'rgba(176, 144, 79, 0.28)'
  for (const l of LAYERS) {
    ctx.beginPath()
    ctx.roundRect(l.x + 2, l.y + 2, l.w - 4, l.h - 4, 12)
    ctx.stroke()
  }
  ctx.setLineDash([])
}

export function createWebPrototypePage(): PageContent {
  const background = canvasTexture(PAGE_PX.width, PAGE_PX.height, 1.5, drawBackground)
  const layers: PageLayer[] = LAYERS.map(({ draw, ...spec }) => ({
    ...spec,
    texture: canvasTexture(spec.w, spec.h, 2, draw),
  }))
  return {
    background,
    layers,
    dispose: () => {
      background.dispose()
      layers.forEach((l) => l.texture.dispose())
    },
  }
}

/** 툴바 주소창 문구 */
export const ADDRESS_TEXT = 'localhost / web-prototype'
