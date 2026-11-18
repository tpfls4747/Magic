import * as THREE from 'three'
import { canvasTexture, type Draw } from './uiCanvas'

/**
 * Web Prototype — 브라우저 화면 콘텐츠 (임시 데모)
 *
 * 실제 웹 프로젝트가 정해지기 전까지 사용하는 데모 랜딩 페이지입니다.
 * 성과·사용자 조사·클라이언트 이름 같은 확인되지 않은 내용은 넣지 않습니다.
 *
 * 실제 작업물로 바꿀 때는 이 파일만 교체하면 됩니다.
 * - 배경 1장 + UI 레이어 여러 장(요소별 텍스처)
 * - 각 레이어는 화면 안의 원래 위치(x·y)와 '깊이 계층(tier)'만 가집니다.
 *   실제 깊이(m)는 전시 쪽(WebPrototypeExhibit)이 브라우저 크기와 카메라 시점에서 계산합니다.
 * 좌표는 1280 × 754 논리 픽셀(좌상단 기준) — 화면 영역 비율과 같습니다.
 */

export const PAGE_PX = { width: 1280, height: 754 } as const

export interface PageLayer {
  name: string
  x: number
  y: number
  w: number
  h: number
  /**
   * 펼쳤을 때의 깊이 계층 — 1 이 화면에 가장 가깝고 숫자가 클수록 앞으로 나옵니다.
   * 같은 계층의 레이어는 같은 평면에 놓여, 펼친 상태에서도 원래 화면 구성이 읽힙니다.
   */
  tier: number
  /** 떠오를 때 화면에 그림자를 드리울지 — 바탕이 있는 카드형 레이어만 (글자만 있는 레이어는 false) */
  shadow: boolean
  texture: THREE.CanvasTexture
}

export interface PageContent {
  background: THREE.CanvasTexture
  layers: PageLayer[]
  /** 가장 앞 계층 번호 */
  maxTier: number
  dispose: () => void
}

// ── 색 — 아이보리 바탕 위에서 충분히 읽히도록 (대비는 #fbf8f2 바탕 기준)
const SANS = 'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", sans-serif'
const SERIF = '"Cormorant Garamond", "Times New Roman", serif'
/** 본문·제목 — 대비 약 15:1 */
const INK = '#241e2a'
/** 보조 텍스트 — 대비 약 7:1 (이전 #8a8090 은 약 3.6:1) */
const MUTED = '#5a5062'
/** 라벤더 강조 — 대비 약 6.6:1 (이전 #7f6cb3 은 약 4.2:1) */
const LAVENDER = '#5f4d99'
/** 큰 글자용 골드 — 대비 약 4.7:1 */
const GOLD_TEXT = '#8a6a2f'
/** 장식용 골드 (선·아이콘) */
const GOLD = '#a8843f'
const CARD_BG = '#fffdf8'

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

/** 막대로 표현한 본문 자리 (실제 문구 대신) */
function lines(ctx: CanvasRenderingContext2D, x: number, y: number, widths: number[], gap = 16) {
  ctx.fillStyle = 'rgba(36, 30, 42, 0.2)'
  widths.forEach((w, i) => {
    rr(ctx, x, y + i * gap, w, 8, 4)
    ctx.fill()
  })
}

/** 카드 바탕 — 아이보리 + 또렷한 골드 테두리 */
function card(ctx: CanvasRenderingContext2D, w: number, h: number, r = 18) {
  rr(ctx, 1.5, 1.5, w - 3, h - 3, r)
  ctx.fillStyle = CARD_BG
  ctx.fill()
  ctx.strokeStyle = 'rgba(168, 132, 63, 0.55)'
  ctx.lineWidth = 2
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

/**
 * 레이어 계층 — 페이지 구조를 따라 아래에서 위로:
 * 1 푸터 · 2 카드 · 3 이미지 · 4 히어로 문구 · 5 CTA · 6 내비게이션(고정 헤더)
 */
const LAYERS: LayerSpec[] = [
  {
    name: 'navigation',
    x: 0,
    y: 0,
    w: 1280,
    h: 68,
    tier: 6,
    shadow: true,
    draw: (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 253, 248, 0.98)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(168, 132, 63, 0.45)'
      ctx.fillRect(0, h - 2, w, 2)
      text(ctx, '◆', 56, 44, `400 18px ${SANS}`, GOLD)
      text(ctx, 'Prototype', 82, 45, `italic 500 28px ${SERIF}`, INK)
      ;['Work', 'Studio', 'Journal', 'Contact'].forEach((label, i) =>
        text(ctx, label, 610 + i * 116, 43, `600 16px ${SANS}`, MUTED, 'left', 0.5),
      )
      rr(ctx, w - 184, 15, 128, 38, 19)
      ctx.fillStyle = INK
      ctx.fill()
      text(ctx, 'Get started', w - 120, 40, `600 14px ${SANS}`, '#ffffff', 'center')
    },
  },
  {
    name: 'hero',
    x: 64,
    y: 112,
    w: 580,
    h: 240,
    tier: 4,
    shadow: false,
    draw: (ctx) => {
      text(ctx, 'A LIVING INTERFACE', 2, 22, `700 14px ${SANS}`, LAVENDER, 'left', 4)
      text(ctx, 'Design that', 0, 100, `500 74px ${SERIF}`, INK)
      text(ctx, 'breathes.', 0, 172, `italic 500 74px ${SERIF}`, GOLD_TEXT)
      text(ctx, '재사용 가능한 컴포넌트로 구성한 랜딩 페이지 프로토타입', 2, 224, `500 19px ${SANS}`, MUTED)
    },
  },
  {
    name: 'cta',
    x: 64,
    y: 370,
    w: 400,
    h: 56,
    tier: 5,
    shadow: true,
    draw: (ctx) => {
      rr(ctx, 0, 0, 232, 56, 28)
      ctx.fillStyle = INK
      ctx.fill()
      text(ctx, 'Explore prototype  →', 116, 34, `600 16px ${SANS}`, '#ffffff', 'center')
      text(ctx, 'View components', 262, 34, `600 16px ${SANS}`, INK)
      ctx.fillStyle = 'rgba(36, 30, 42, 0.5)'
      ctx.fillRect(262, 41, 132, 1.5)
    },
  },
  {
    name: 'image',
    x: 676,
    y: 96,
    w: 540,
    h: 330,
    tier: 3,
    shadow: true,
    draw: (ctx, w, h) => {
      // 이미지 자리: 라벤더 → 샴페인 그라데이션 위의 아치 실루엣
      rr(ctx, 0, 0, w, h, 22)
      ctx.save()
      ctx.clip()
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#cdbfea')
      g.addColorStop(0.55, '#e9dccd')
      g.addColorStop(1, '#ddc596')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255, 253, 248, 0.6)'
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
      ctx.fillStyle = 'rgba(255, 253, 248, 0.85)'
      ctx.fill()
      ctx.restore()
      rr(ctx, 1, 1, w - 2, h - 2, 22)
      ctx.strokeStyle = 'rgba(168, 132, 63, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()
      rr(ctx, 18, h - 46, 80, 28, 14)
      ctx.fillStyle = 'rgba(255, 253, 248, 0.92)'
      ctx.fill()
      text(ctx, 'IMAGE', 58, h - 27, `700 12px ${SANS}`, MUTED, 'center', 2)
    },
  },
  ...CARD_TOPICS.map<LayerSpec>((topic, i) => ({
    name: `card-${i + 1}`,
    x: 64 + i * 392,
    y: 452,
    w: 368,
    h: 180,
    tier: 2,
    shadow: true,
    draw: (ctx, w) => {
      card(ctx, w, 180)
      ctx.beginPath()
      ctx.arc(46, 48, 22, 0, Math.PI * 2)
      ctx.fillStyle = i === 1 ? 'rgba(95, 77, 153, 0.14)' : 'rgba(168, 132, 63, 0.16)'
      ctx.fill()
      text(ctx, topic.icon, 46, 56, `400 20px ${SANS}`, i === 1 ? LAVENDER : GOLD, 'center')
      text(ctx, topic.title, 28, 106, `500 32px ${SERIF}`, INK)
      lines(ctx, 28, 128, [w - 84, w - 136])
    },
  })),
  {
    name: 'footer',
    x: 0,
    y: 664,
    w: 1280,
    h: 90,
    tier: 1,
    shadow: true,
    draw: (ctx, w, h) => {
      ctx.fillStyle = '#ece3d6'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(168, 132, 63, 0.35)'
      ctx.fillRect(0, 0, w, 1.5)
      text(ctx, 'Prototype', 64, 53, `italic 500 24px ${SERIF}`, INK)
      ;[0, 1, 2].forEach((c) => lines(ctx, 520 + c * 220, 34, [120, 84], 18))
      text(ctx, 'DEMO LAYOUT', w - 64, 52, `700 12px ${SANS}`, MUTED, 'right', 2)
    },
  },
]

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#f8f3ea')
  g.addColorStop(1, '#f1e9dd')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // 레이어가 떠난 자리에 남는 옅은 그리드와 자리 표시 — 펼쳤을 때 '구조'가 보이도록
  ctx.strokeStyle = 'rgba(95, 77, 153, 0.07)'
  ctx.lineWidth = 1
  for (let x = 64; x < w; x += 96) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = 'rgba(168, 132, 63, 0.3)'
  for (const l of LAYERS) {
    ctx.beginPath()
    ctx.roundRect(l.x + 2, l.y + 2, l.w - 4, l.h - 4, 12)
    ctx.stroke()
  }
  ctx.setLineDash([])
}

/** 멀리서 비스듬히 보는 화면이므로 텍스처 이방성 필터를 높여 글자를 선명하게 */
function sharpen(tex: THREE.CanvasTexture) {
  tex.anisotropy = 8
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

export function createWebPrototypePage(): PageContent {
  const background = sharpen(canvasTexture(PAGE_PX.width, PAGE_PX.height, 1.5, drawBackground))
  const layers: PageLayer[] = LAYERS.map(({ draw, ...spec }) => ({
    ...spec,
    texture: sharpen(canvasTexture(spec.w, spec.h, 2, draw)),
  }))
  return {
    background,
    layers,
    maxTier: Math.max(...layers.map((l) => l.tier)),
    dispose: () => {
      background.dispose()
      layers.forEach((l) => l.texture.dispose())
    },
  }
}

/** 툴바 주소창 문구 */
export const ADDRESS_TEXT = 'localhost / web-prototype'
