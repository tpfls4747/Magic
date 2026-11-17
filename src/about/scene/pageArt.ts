import * as THREE from 'three'
import type { AboutContent, AboutPage, AboutText } from '../types'
import { grain, makeCanvas, toTexture } from './textures'

/**
 * 다이어리 페이지 인쇄면 (캔버스 텍스처).
 * 콘텐츠 데이터에서 그대로 그리므로 aboutContent.ts 를 고치면 3D 페이지도 바뀝니다.
 * 좌표는 페이지 폭 1000 기준의 가상 단위로 계산한 뒤 실제 해상도로 축소/확대합니다.
 */

const INK = '#2a2232'
const INK_SOFT = 'rgba(42,34,50,0.8)'
const GOLD = '#a8874f'
const GOLD_SOFT = 'rgba(168,135,79,0.55)'
const LAVENDER_INK = '#7f6cb3'
const SERIF = "'Cormorant Garamond', 'Times New Roman', serif"
const SANS = "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"

/** 가상 좌표계 */
const VW = 1000
const VH = 1400

export type PageSide = 'left' | 'right'

interface Pen {
  ctx: CanvasRenderingContext2D
  side: PageSide
}

function paperBase(ctx: CanvasRenderingContext2D, side: PageSide, w: number, h: number, seed: number) {
  ctx.fillStyle = '#f8f2e6'
  ctx.fillRect(0, 0, w, h)
  // 가장자리로 갈수록 아주 살짝 따뜻하게
  const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.95)
  v.addColorStop(0, 'rgba(255,252,245,0)')
  v.addColorStop(1, 'rgba(226,210,184,0.35)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 7, seed)
  // 책등 쪽 그늘 (제본 홈)
  const gx = side === 'left' ? w : 0
  const g = ctx.createLinearGradient(gx, 0, side === 'left' ? w * 0.86 : w * 0.14, 0)
  g.addColorStop(0, 'rgba(120,96,70,0.22)')
  g.addColorStop(0.35, 'rgba(120,96,70,0.07)')
  g.addColorStop(1, 'rgba(120,96,70,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** 바깥 여백이 넓고 책등 쪽 여백이 좁은 본문 영역 */
function frame(side: PageSide) {
  const outer = 104
  const inner = 92
  return {
    x: side === 'left' ? outer : inner,
    w: VW - outer - inner,
    top: 132,
    bottom: VH - 120,
  }
}

function font(size: number, family: string, style = '', weight = 400) {
  return `${style} ${weight} ${size}px ${family}`.trim()
}

/** 단어 단위 줄바꿈 (한국어는 띄어쓰기 기준, 너무 긴 단어는 글자 단위) */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxW) {
        line = test
        continue
      }
      if (line) lines.push(line)
      if (ctx.measureText(word).width <= maxW) {
        line = word
      } else {
        let chunk = ''
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxW) {
            lines.push(chunk)
            chunk = ch
          } else chunk += ch
        }
        line = chunk
      }
    }
    lines.push(line)
  }
  return lines
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, kind: 'draft' | 'pending') {
  ctx.font = font(21, SANS, '', 600)
  const w = ctx.measureText(label).width + 26
  const h = 34
  ctx.beginPath()
  ctx.roundRect(x, y - h + 8, w, h, h / 2)
  if (kind === 'pending') {
    ctx.fillStyle = 'rgba(207,195,230,0.42)'
    ctx.fill()
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = 'rgba(127,108,179,0.7)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = LAVENDER_INK
  } else {
    ctx.fillStyle = 'rgba(220,192,142,0.38)'
    ctx.fill()
    ctx.fillStyle = '#8c6d3c'
  }
  ctx.fillText(label, x + 13, y - 1)
  return w
}

/**
 * AboutText 그리기 — 반환값은 다음 줄의 y.
 * pending 은 '작성 필요' 표시 + 안내 + 비어 있는 필기 줄로 그립니다.
 */
function text(
  pen: Pen,
  value: AboutText,
  x: number,
  y: number,
  maxW: number,
  opts: { size?: number; lineH?: number; family?: string; color?: string; emptyLines?: number } = {},
) {
  const { ctx } = pen
  const size = opts.size ?? 34
  const lineH = opts.lineH ?? size * 1.62
  const family = opts.family ?? SANS
  ctx.textBaseline = 'alphabetic'

  if (typeof value === 'object' && value.kind === 'pending') {
    const w = pill(ctx, x, y, '작성 필요', 'pending')
    ctx.font = font(size * 0.82, SANS, '', 500)
    ctx.fillStyle = '#5f4f96'
    const lines = wrap(ctx, value.note, maxW - w - 14)
    lines.forEach((l, i) => ctx.fillText(l, x + w + 14, y + i * size * 1.25))
    let yy = y + Math.max(1, lines.length) * size * 1.25 + size * 0.5
    // 아직 쓰지 않은 필기 줄
    ctx.strokeStyle = 'rgba(168,135,79,0.42)'
    ctx.lineWidth = 1.8
    for (let i = 0; i < (opts.emptyLines ?? 2); i++) {
      ctx.beginPath()
      ctx.moveTo(x, yy + 6)
      ctx.lineTo(x + maxW, yy + 6)
      ctx.stroke()
      yy += lineH
    }
    return yy + size * 0.3
  }

  const str = typeof value === 'string' ? value : value.text
  ctx.font = font(size, family, '', family === SANS ? 500 : 400)
  ctx.fillStyle = opts.color ?? INK
  const lines = wrap(ctx, str, maxW)
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH))
  const lastY = y + (lines.length - 1) * lineH
  if (typeof value === 'object' && value.kind === 'draft') {
    const lw = ctx.measureText(lines[lines.length - 1]).width
    const fits = lw + 90 < maxW
    const px = fits ? x + lw + 12 : x
    const py = fits ? lastY : lastY + lineH
    pill(ctx, px, py, '임시', 'draft')
    return (fits ? lastY : py) + lineH
  }
  return lastY + lineH
}

function rule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color = GOLD_SOFT) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill = false) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = GOLD
    ctx.fill()
  } else {
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 1.6
    ctx.stroke()
  }
}

function folio(pen: Pen, label: string) {
  const { ctx, side } = pen
  ctx.font = font(26, SERIF, 'italic')
  ctx.fillStyle = GOLD
  ctx.textAlign = side === 'left' ? 'left' : 'right'
  ctx.fillText(label, side === 'left' ? 104 : VW - 104, VH - 64)
  ctx.textAlign = 'left'
}

/* ───────────────────────────── 페이지 종류 ───────────────────────────── */

function drawTitle(pen: Pen, content: AboutContent) {
  const { ctx } = pen
  // 이중 테두리
  ctx.strokeStyle = GOLD_SOFT
  ctx.lineWidth = 2
  ctx.strokeRect(70, 80, VW - 140, VH - 160)
  ctx.lineWidth = 1
  ctx.strokeRect(84, 94, VW - 168, VH - 188)
  ctx.textAlign = 'center'
  ctx.fillStyle = LAVENDER_INK
  ctx.font = font(26, SANS, '', 500)
  ctx.letterSpacing = '8px'
  ctx.fillText('ABOUT', VW / 2, 420)
  ctx.letterSpacing = '0px'
  ctx.fillStyle = INK
  ctx.font = font(118, SERIF, 'italic')
  ctx.fillText('Behind', VW / 2, 560)
  ctx.fillText('the Magic', VW / 2, 680)
  diamond(ctx, VW / 2, 760, 9, true)
  ctx.font = font(30, SERIF)
  ctx.letterSpacing = '6px'
  ctx.fillStyle = GOLD
  ctx.fillText("THE DESIGNER'S DESK", VW / 2, 830)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
  // 이름 · 직함
  const nameY = 1010
  if (typeof content.name === 'string') {
    ctx.textAlign = 'center'
    ctx.font = font(52, SERIF, 'italic')
    ctx.fillStyle = INK
    ctx.fillText(content.name, VW / 2, nameY)
    ctx.textAlign = 'left'
  } else {
    text(pen, content.name, 250, nameY, 520, { size: 30, emptyLines: 1 })
  }
  ctx.textAlign = 'center'
  ctx.font = font(30, SANS)
  ctx.fillStyle = INK_SOFT
  const role = typeof content.role === 'string' ? content.role : content.role.kind === 'draft' ? content.role.text : ''
  if (role) ctx.fillText(role, VW / 2, nameY + 110)
  ctx.textAlign = 'left'
}

function drawOrnament(pen: Pen) {
  const { ctx } = pen
  ctx.save()
  ctx.translate(VW / 2, VH / 2)
  ctx.strokeStyle = 'rgba(168,135,79,0.4)'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6)
    ctx.beginPath()
    ctx.moveTo(0, 40)
    ctx.quadraticCurveTo(40, 120, 0, 200)
    ctx.quadraticCurveTo(-40, 120, 0, 40)
    ctx.stroke()
  }
  ctx.restore()
  diamond(ctx, VW / 2, VH / 2, 12, true)
  ctx.textAlign = 'center'
  ctx.font = font(34, SERIF, 'italic')
  ctx.fillStyle = GOLD
  ctx.fillText('Unlock My World', VW / 2, VH / 2 + 300)
  ctx.textAlign = 'left'
}

function drawContents(pen: Pen, content: AboutContent) {
  const { ctx, side } = pen
  const f = frame(side)
  ctx.font = font(26, SANS, '', 500)
  ctx.letterSpacing = '7px'
  ctx.fillStyle = LAVENDER_INK
  ctx.fillText('CONTENTS', f.x, f.top + 40)
  ctx.letterSpacing = '0px'
  ctx.font = font(96, SERIF, 'italic')
  ctx.fillStyle = INK
  ctx.fillText('In this diary', f.x, f.top + 160)
  rule(ctx, f.x, f.top + 220, f.w)
  let y = f.top + 360
  for (const p of content.pages) {
    ctx.font = font(40, SERIF)
    ctx.fillStyle = GOLD
    ctx.fillText(p.number, f.x, y)
    ctx.font = font(64, SERIF)
    ctx.fillStyle = INK
    ctx.fillText(p.title, f.x + 90, y)
    ctx.font = font(28, SANS)
    ctx.fillStyle = INK_SOFT
    ctx.fillText(p.subtitle, f.x + 92, y + 52)
    y += 210
  }
  folio(pen, 'ii')
}

function drawSectionLeft(pen: Pen, page: AboutPage, index: number) {
  const { ctx, side } = pen
  const f = frame(side)
  // 큰 외곽선 숫자
  ctx.font = font(250, SERIF)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.strokeText(page.number, f.x - 8, f.top + 220)
  ctx.font = font(26, SANS, '', 500)
  ctx.letterSpacing = '7px'
  ctx.fillStyle = LAVENDER_INK
  ctx.fillText(`PAGE ${page.number}`, f.x, f.top + 320)
  ctx.letterSpacing = '0px'
  ctx.font = font(124, SERIF, 'italic')
  ctx.fillStyle = INK
  const titleLines = wrap(ctx, page.title, f.w)
  titleLines.forEach((l, i) => ctx.fillText(l, f.x, f.top + 450 + i * 116))
  let y = f.top + 450 + (titleLines.length - 1) * 116 + 72
  ctx.font = font(32, SANS, '', 500)
  ctx.fillStyle = '#8c6d3c'
  ctx.fillText(page.subtitle, f.x, y)
  y += 56
  rule(ctx, f.x, y, 120, GOLD)
  y += 96
  text(pen, page.intro, f.x, y, f.w, { size: 36, emptyLines: 3 })
  folio(pen, String(index * 2 + 1))
}

function drawSectionRight(pen: Pen, page: AboutPage, index: number) {
  const { ctx, side } = pen
  const f = frame(side)
  let y = f.top + 30
  for (const block of page.blocks) {
    if (block.type === 'paragraph') {
      y = heading(ctx, block.heading, f.x, y, f.w)
      y = text(pen, block.text, f.x, y + 20, f.w, { size: 34, emptyLines: 2 }) + 46
    } else {
      if (block.heading) y = heading(ctx, block.heading, f.x, y, f.w)
      const many = block.items.length > 3
      for (const [i, item] of block.items.entries()) {
        ctx.font = font(30, SERIF)
        ctx.fillStyle = GOLD
        ctx.fillText(String(i + 1).padStart(2, '0'), f.x, y + 10)
        ctx.font = font(many ? 54 : 50, SERIF, item.name.startsWith('Strength') ? 'italic' : '')
        ctx.fillStyle = INK
        const nameLines = wrap(ctx, item.name, f.w - 70)
        nameLines.forEach((l, k) => ctx.fillText(l, f.x + 64, y + 12 + k * 54))
        y += 12 + (nameLines.length - 1) * 54
        if (item.label) {
          ctx.font = font(25, SANS, '', 500)
          ctx.fillStyle = LAVENDER_INK
          ctx.fillText(item.label, f.x + 66, y + 44)
          y += 44
        }
        y = text(pen, item.description, f.x + 66, y + 56, f.w - 66, { size: 30, emptyLines: many ? 0 : 1 })
        y += many ? 30 : 34
        if (i < block.items.length - 1) {
          rule(ctx, f.x + 66, y - 18, f.w - 66, 'rgba(168,135,79,0.2)')
          y += 26
        }
      }
      y += 30
    }
  }
  folio(pen, String(index * 2 + 2))
}

function heading(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number) {
  ctx.font = font(30, SANS, '', 600)
  ctx.fillStyle = INK
  ctx.fillText(label, x, y + 30)
  rule(ctx, x, y + 58, w, 'rgba(168,135,79,0.35)')
  return y + 120
}

/* ───────────────────────────── 공개 함수 ───────────────────────────── */

export type PageKind =
  | { kind: 'title' }
  | { kind: 'ornament' }
  | { kind: 'contents' }
  | { kind: 'section-left'; page: number }
  | { kind: 'section-right'; page: number }

/** 페이지 한 면을 캔버스 텍스처로 그립니다 */
export function drawPage(
  spec: PageKind,
  side: PageSide,
  content: AboutContent,
  widthPx: number,
): THREE.CanvasTexture {
  const w = widthPx
  const h = Math.round(widthPx * (VH / VW))
  const { canvas, ctx } = makeCanvas(w, h)
  paperBase(ctx, side, w, h, 40 + spec.kind.length)
  ctx.save()
  ctx.scale(w / VW, h / VH)
  const pen: Pen = { ctx, side }
  switch (spec.kind) {
    case 'title':
      drawTitle(pen, content)
      break
    case 'ornament':
      drawOrnament(pen)
      break
    case 'contents':
      drawContents(pen, content)
      break
    case 'section-left':
      drawSectionLeft(pen, content.pages[spec.page], spec.page)
      break
    case 'section-right':
      drawSectionRight(pen, content.pages[spec.page], spec.page)
      break
  }
  ctx.restore()
  return toTexture(canvas)
}

/** 표지 안쪽 면지 — 라벤더 바탕에 금색 마름모 무늬 */
export function drawEndpaper(widthPx: number) {
  const w = widthPx
  const h = Math.round(w * 1.4)
  const { canvas, ctx } = makeCanvas(w, h)
  ctx.fillStyle = '#cbbfe2'
  ctx.fillRect(0, 0, w, h)
  const step = w / 9
  ctx.strokeStyle = 'rgba(168,135,79,0.55)'
  ctx.lineWidth = Math.max(1, w / 600)
  for (let y = 0; y < h + step; y += step) {
    for (let x = 0; x < w + step; x += step) {
      const ox = (Math.round(y / step) % 2) * (step / 2)
      ctx.save()
      ctx.translate(x + ox, y)
      ctx.beginPath()
      ctx.moveTo(0, -step * 0.18)
      ctx.lineTo(step * 0.12, 0)
      ctx.lineTo(0, step * 0.18)
      ctx.lineTo(-step * 0.12, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  }
  grain(ctx, w, h, 8, 77)
  return toTexture(canvas)
}

/**
 * 표지 바깥면 — 가죽 색 + 금박(제목, 테두리, 자물쇠 문양).
 * 같은 그림을 두 번 그려 하나는 색, 하나는 금박 영역 마스크(metalness)로 사용합니다.
 */
export function drawCover(widthPx: number) {
  const w = widthPx
  const h = Math.round(w * (0.218 / 0.157))
  const draw = (mode: 'color' | 'metal' | 'rough') => {
    const { canvas, ctx } = makeCanvas(w, h)
    const base = mode === 'color' ? '#6c5c96' : mode === 'metal' ? '#000000' : '#ffffff'
    const foil = mode === 'color' ? '#e3c58d' : mode === 'metal' ? '#ffffff' : '#4a4a4a'
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    if (mode === 'color') grain(ctx, w, h, 10, 91)
    const s = w / 1000
    ctx.save()
    ctx.scale(s, s)
    const H = h / s
    ctx.strokeStyle = foil
    ctx.fillStyle = foil
    // 이중 금박 테두리
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.roundRect(70, 70, 860, H - 140, 26)
    ctx.stroke()
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(98, 98, 804, H - 196, 16)
    ctx.stroke()
    // 모서리 장식
    for (const [cx, cy] of [
      [98, 98],
      [902, 98],
      [98, H - 98],
      [902, H - 98],
    ]) {
      diamondFill(ctx, cx, cy, 16)
    }
    // 자물쇠 문양 (열쇠 구멍)
    const kx = 500
    const ky = H * 0.43
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(kx, ky, 120, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(kx, ky, 100, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(kx, ky - 20, 30, 0, Math.PI * 2)
    ctx.moveTo(kx - 18, ky)
    ctx.lineTo(kx - 30, ky + 62)
    ctx.lineTo(kx + 30, ky + 62)
    ctx.lineTo(kx + 18, ky)
    ctx.fill()
    // 제목
    ctx.textAlign = 'center'
    ctx.font = font(92, SERIF, 'italic')
    ctx.fillText('Behind the Magic', 500, H * 0.68)
    ctx.font = font(30, SERIF)
    ctx.letterSpacing = '9px'
    ctx.fillText("THE DESIGNER'S DESK", 500, H * 0.68 + 74)
    ctx.restore()
    return toTexture(canvas, mode === 'color')
  }
  return { map: draw('color'), metalnessMap: draw('metal'), roughnessMap: draw('rough') }
}

function diamondFill(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}

/** 다이어리를 그리기 전에 웹폰트가 준비되도록 */
export async function loadPageFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load(`400 40px 'Cormorant Garamond'`),
      document.fonts.load(`italic 400 40px 'Cormorant Garamond'`),
    ])
  } catch {
    /* 폰트가 없으면 대체 서체로 그립니다 */
  }
}
