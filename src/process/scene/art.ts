import * as THREE from 'three'
import type { ProcessStage } from '../types'

/**
 * 캔버스로 그리는 인쇄면 — 외부 이미지 없이 카드 · 메모 · 화면을 만듭니다.
 * 3D 카드에는 단계 이름과 키워드만 크게 넣고, 긴 설명은 HTML 패널에서 보여줍니다.
 */

export const INK = '#2f2836'
export const GOLD = '#a8874f'
export const LAVENDER_INK = '#7f6cb3'
const SERIF = "'Cormorant Garamond', 'Times New Roman', serif"
const SANS = "'Pretendard', system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, ctx: c.getContext('2d')! }
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const rand = seeded(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * amount
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

function texture(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, seed: number) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(255,255,255,0)')
  v.addColorStop(1, 'rgba(200,180,150,0.22)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h, 7, seed)
}

/* ───────────────────────────── 단계 카드 ───────────────────────────── */

/** 단계 카드 앞면 — 번호 · 단계 이름 · 키워드만 크게 */
export function drawStageCard(stage: ProcessStage, px: number) {
  const w = px
  const h = Math.round(px * (0.71 / 0.54))
  const { c, ctx } = canvas(w, h)
  paper(ctx, w, h, '#fbf7ef', Number(stage.number) * 13)
  const s = w / 1000
  ctx.save()
  ctx.scale(s, s)
  const H = h / s
  // 안쪽 금색 테두리
  ctx.strokeStyle = 'rgba(168,135,79,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(52, 52, 896, H - 104)
  // 번호 (외곽선)
  ctx.font = `400 230px ${SERIF}`
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2.5
  ctx.strokeText(stage.number, 100, 300)
  // STAGE · 한국어 이름
  ctx.font = `600 34px ${SANS}`
  ctx.fillStyle = LAVENDER_INK
  ctx.letterSpacing = '8px'
  ctx.fillText(`STAGE ${stage.number}`, 106, 390)
  ctx.letterSpacing = '0px'
  // 제목
  ctx.font = `italic 400 ${stage.title.length > 8 ? 150 : 168}px ${SERIF}`
  ctx.fillStyle = INK
  ctx.fillText(stage.title, 96, 560)
  ctx.font = `600 54px ${SANS}`
  ctx.fillStyle = '#8c6d3c'
  ctx.fillText(stage.label, 104, 650)
  // 구분선
  ctx.fillStyle = GOLD
  ctx.fillRect(104, 700, 120, 3)
  // 키워드 태그
  let y = 800
  ctx.font = `500 50px ${SANS}`
  for (const kw of stage.keywords) {
    const tw = ctx.measureText(kw).width
    ctx.beginPath()
    ctx.roundRect(100, y - 54, tw + 64, 78, 39)
    ctx.fillStyle = 'rgba(207,195,230,0.38)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(127,108,179,0.45)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.fillText(kw, 132, y)
    y += 104
  }
  ctx.restore()
  return texture(c)
}

/* ───────────────────────────── 소품 인쇄면 ───────────────────────────── */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void

function sheet(w: number, h: number, color: string, seed: number, draw: Draw) {
  const { c, ctx } = canvas(w, h)
  paper(ctx, w, h, color, seed)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  draw(ctx, w, h, seeded(seed))
  return texture(c)
}

function heading(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = INK) {
  ctx.font = `italic 400 ${size}px ${SERIF}`
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

function scribble(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rand: () => number, color = 'rgba(47,40,54,0.45)') {
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  let cx = x
  while (cx < x + len) {
    const step = 10 + rand() * 14
    ctx.quadraticCurveTo(cx + step / 2, y + (rand() - 0.5) * 7, cx + step, y + (rand() - 0.5) * 3)
    cx += step
  }
  ctx.stroke()
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = 'rgba(47,40,54,0.55)', fill?: string) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 8)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
}

function check(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + s * 0.35, y + s * 0.35)
  ctx.lineTo(x + s, y - s * 0.4)
  ctx.stroke()
}

export const artifactArt = {
  researchNote: () =>
    sheet(512, 640, '#fbf8f1', 3, (ctx, w, h, r) => {
      ctx.strokeStyle = 'rgba(127,108,179,0.25)'
      ctx.lineWidth = 2
      for (let y = 150; y < h - 30; y += 46) {
        ctx.beginPath()
        ctx.moveTo(40, y)
        ctx.lineTo(w - 40, y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(200,120,120,0.35)'
      ctx.beginPath()
      ctx.moveTo(84, 40)
      ctx.lineTo(84, h - 20)
      ctx.stroke()
      heading(ctx, 'Research notes', 104, 100, 64)
      for (let y = 190; y < h - 60; y += 46) {
        ctx.fillStyle = GOLD
        ctx.beginPath()
        ctx.arc(110, y - 8, 4, 0, Math.PI * 2)
        ctx.fill()
        scribble(ctx, 126, y - 8, 120 + r() * 230, r)
      }
    }),
  observationMemo: () =>
    sheet(400, 400, '#f4ead6', 5, (ctx, _w, _h, r) => {
      heading(ctx, 'observe', 40, 90, 70, '#8c6d3c')
      for (let i = 0; i < 4; i++) scribble(ctx, 44, 170 + i * 52, 160 + r() * 140, r)
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(320, 320, 34, 0, Math.PI * 2)
      ctx.stroke()
    }),
  problemCard: () =>
    sheet(560, 400, '#fbf8f1', 7, (ctx, _w, _h, r) => {
      ctx.font = `600 30px ${SANS}`
      ctx.fillStyle = LAVENDER_INK
      ctx.letterSpacing = '5px'
      ctx.fillText('PROBLEM', 44, 76)
      ctx.letterSpacing = '0px'
      heading(ctx, 'Statement', 44, 150, 72)
      ctx.fillStyle = GOLD
      ctx.fillRect(46, 178, 80, 3)
      for (let i = 0; i < 3; i++) scribble(ctx, 46, 238 + i * 46, 300 + r() * 150, r)
    }),
  sticky: (color: string, word: string) => () =>
    sheet(320, 320, color, word.length * 11, (ctx, _w, _h, r) => {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(0, 0, 320, 52)
      heading(ctx, word, 34, 150, 76)
      scribble(ctx, 38, 216, 180 + r() * 60, r)
      scribble(ctx, 38, 260, 120 + r() * 80, r)
    }),
  hmw: () =>
    sheet(420, 420, '#e7defa', 11, (ctx, _w, _h, r) => {
      ctx.font = `600 28px ${SANS}`
      ctx.fillStyle = LAVENDER_INK
      ctx.letterSpacing = '5px'
      ctx.fillText('HMW', 44, 78)
      ctx.letterSpacing = '0px'
      heading(ctx, 'How might we', 40, 170, 60)
      heading(ctx, '… ?', 40, 240, 60, '#8c6d3c')
      scribble(ctx, 44, 316, 260 + r() * 60, r)
      scribble(ctx, 44, 362, 180, r)
    }),
  wireframe: () =>
    sheet(560, 420, '#fbf8f1', 13, (ctx, _w, _h, r) => {
      box(ctx, 30, 30, 500, 360)
      ctx.beginPath()
      ctx.moveTo(30, 82)
      ctx.lineTo(530, 82)
      ctx.stroke()
      box(ctx, 56, 108, 200, 140, 'rgba(47,40,54,0.45)', 'rgba(207,195,230,0.25)')
      ctx.beginPath()
      ctx.moveTo(56, 108)
      ctx.lineTo(256, 248)
      ctx.moveTo(256, 108)
      ctx.lineTo(56, 248)
      ctx.stroke()
      for (let i = 0; i < 5; i++) scribble(ctx, 284, 124 + i * 28, 120 + r() * 100, r)
      box(ctx, 56, 290, 140, 52, 'rgba(127,108,179,0.7)')
      box(ctx, 214, 290, 140, 52)
    }),
  flow: () =>
    sheet(560, 380, '#fbf8f1', 17, (ctx) => {
      const nodes: [number, number][] = [
        [80, 110],
        [230, 110],
        [380, 110],
        [230, 270],
        [460, 270],
      ]
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 4
      const link = (a: number, b: number) => {
        ctx.beginPath()
        ctx.moveTo(nodes[a][0], nodes[a][1])
        ctx.lineTo(nodes[b][0], nodes[b][1])
        ctx.stroke()
      }
      link(0, 1)
      link(1, 2)
      link(1, 3)
      link(3, 4)
      nodes.forEach(([x, y], i) => {
        if (i === 3) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.PI / 4)
          box(ctx, -32, -32, 64, 64, LAVENDER_INK, '#efe9f8')
          ctx.restore()
        } else box(ctx, x - 52, y - 30, 104, 60, 'rgba(47,40,54,0.6)', '#fffdf8')
      })
      heading(ctx, 'User flow', 30, 350, 44, '#8c6d3c')
    }),
  uiSketch: () =>
    sheet(380, 560, '#fbf8f1', 19, (ctx, _w, _h, r) => {
      box(ctx, 70, 30, 240, 500)
      box(ctx, 96, 80, 188, 120, 'rgba(47,40,54,0.4)', 'rgba(220,192,142,0.22)')
      for (let i = 0; i < 4; i++) scribble(ctx, 98, 240 + i * 36, 100 + r() * 80, r)
      box(ctx, 96, 440, 188, 50, 'rgba(127,108,179,0.75)', 'rgba(207,195,230,0.3)')
    }),
  browserScreen: () =>
    sheet(640, 420, '#fffdf8', 23, (ctx) => {
      ctx.fillStyle = '#efe7da'
      ctx.fillRect(0, 0, 640, 56)
      ;['#e3b9b9', '#e9d39c', '#b9d3b0'].forEach((c, i) => {
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(30 + i * 26, 28, 8, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(120, 14, 380, 28, 14)
      ctx.fill()
      heading(ctx, 'Prototype', 44, 150, 64)
      ctx.fillStyle = 'rgba(47,40,54,0.25)'
      ctx.fillRect(46, 180, 240, 10)
      ctx.fillRect(46, 204, 200, 10)
      ctx.fillStyle = '#3a3140'
      ctx.beginPath()
      ctx.roundRect(46, 250, 150, 50, 25)
      ctx.fill()
      ctx.fillStyle = '#d9cdef'
      ctx.beginPath()
      ctx.roundRect(340, 96, 256, 270, 18)
      ctx.fill()
      ctx.fillStyle = '#e7d3a8'
      ctx.beginPath()
      ctx.arc(468, 230, 64, 0, Math.PI * 2)
      ctx.fill()
    }),
  phoneScreen: () =>
    sheet(360, 740, '#fffdf8', 29, (ctx) => {
      ctx.fillStyle = '#efe9f8'
      ctx.fillRect(0, 0, 360, 300)
      heading(ctx, 'Hello', 40, 200, 80)
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = 'rgba(168,135,79,0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(30, 340 + i * 110, 300, 86, 18)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(47,40,54,0.3)'
        ctx.fillRect(56, 370 + i * 110, 150, 10)
        ctx.fillRect(56, 394 + i * 110, 100, 10)
      }
      ctx.fillStyle = '#3a3140'
      ctx.beginPath()
      ctx.roundRect(30, 670, 300, 48, 24)
      ctx.fill()
    }),
  checklist: () =>
    sheet(440, 560, '#fbf8f1', 31, (ctx, _w, _h, r) => {
      heading(ctx, 'Checklist', 40, 96, 64)
      for (let i = 0; i < 5; i++) {
        const y = 170 + i * 76
        box(ctx, 44, y - 30, 40, 40)
        if (i < 3) check(ctx, 50, y - 12, 28)
        scribble(ctx, 108, y - 10, 140 + r() * 140, r)
      }
    }),
  revisedScreen: () =>
    sheet(420, 520, '#fbf8f1', 37, (ctx, _w, _h, r) => {
      box(ctx, 40, 30, 340, 460)
      box(ctx, 66, 70, 288, 130, 'rgba(47,40,54,0.4)', 'rgba(207,195,230,0.25)')
      for (let i = 0; i < 4; i++) scribble(ctx, 68, 240 + i * 36, 140 + r() * 120, r)
      // 금색 수정 표시
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.ellipse(210, 410, 130, 44, -0.04, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `italic 400 44px ${SERIF}`
      ctx.fillStyle = GOLD
      ctx.fillText('v2', 300, 70)
    }),
  feedback: (word: string) => () =>
    sheet(360, 260, '#fffdf8', word.length * 7, (ctx, _w, _h, r) => {
      heading(ctx, word, 34, 96, 56, '#8c6d3c')
      scribble(ctx, 36, 156, 200 + r() * 70, r)
      scribble(ctx, 36, 200, 140 + r() * 60, r)
    }),
}

/** 카드 텍스트용 웹폰트가 준비된 뒤 그리기 */
export async function loadArtFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load(`400 40px 'Cormorant Garamond'`),
      document.fonts.load(`italic 400 40px 'Cormorant Garamond'`),
    ])
  } catch {
    /* 대체 서체로 그립니다 */
  }
}
