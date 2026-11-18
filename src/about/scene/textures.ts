import * as THREE from 'three'

/**
 * 외부 이미지 없이 캔버스로 만드는 재질 텍스처.
 * 모듈 단위로 한 번만 만들어 공유합니다.
 */

/** 결정적 의사 난수 — 매번 같은 무늬가 나오도록 */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

export function toTexture(canvas: HTMLCanvasElement, color = true, repeat = false) {
  const t = new THREE.CanvasTexture(canvas)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
  }
  return t
}

/** 고운 입자 노이즈 (종이 · 가죽 · 석고 결) */
export function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
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

let deskTop: { map: THREE.Texture; rough: THREE.Texture } | null = null

/** 아이보리 래커 상판 — 아주 옅은 대리석 결 */
export function deskTopTextures() {
  if (deskTop) return deskTop
  const S = 1024
  const { canvas, ctx } = makeCanvas(S, S)
  ctx.fillStyle = '#efe6d7'
  ctx.fillRect(0, 0, S, S)
  const rand = seeded(7)
  // 부드러운 얼룩
  for (let i = 0; i < 24; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 120 + rand() * 260
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, rand() > 0.5 ? 'rgba(232,222,206,0.35)' : 'rgba(250,246,238,0.4)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, S, S)
  }
  // 가는 대리석 결
  ctx.lineCap = 'round'
  for (let i = 0; i < 9; i++) {
    let x = rand() * S
    let y = rand() * S
    const a = rand() * Math.PI
    ctx.strokeStyle = `rgba(196,178,150,${0.08 + rand() * 0.1})`
    ctx.lineWidth = 0.6 + rand() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 40; k++) {
      x += Math.cos(a + Math.sin(k * 0.4 + i) * 0.6) * 18
      y += Math.sin(a + Math.sin(k * 0.4 + i) * 0.6) * 18
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  grain(ctx, S, S, 6, 3)
  const map = toTexture(canvas, true, true)

  const r = makeCanvas(256, 256)
  r.ctx.fillStyle = '#5a5a5a'
  r.ctx.fillRect(0, 0, 256, 256)
  grain(r.ctx, 256, 256, 26, 11)
  const rough = toTexture(r.canvas, false, true)
  rough.repeat.set(4, 4)
  deskTop = { map, rough }
  return deskTop
}

let leather: THREE.Texture | null = null

/** 가죽 결 — 거칠기 맵으로 사용 (밝을수록 거침) */
export function leatherRoughness() {
  if (leather) return leather
  const S = 512
  const { canvas, ctx } = makeCanvas(S, S)
  ctx.fillStyle = '#9a9a9a'
  ctx.fillRect(0, 0, S, S)
  const rand = seeded(21)
  for (let i = 0; i < 2600; i++) {
    const x = rand() * S
    const y = rand() * S
    const r = 1 + rand() * 3.2
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.6 + rand() * 0.6), rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  grain(ctx, S, S, 20, 5)
  leather = toTexture(canvas, false, true)
  return leather
}

let paperGrain: THREE.Texture | null = null

/** 종이 결 — 내지 거칠기 */
export function paperRoughness() {
  if (paperGrain) return paperGrain
  const { canvas, ctx } = makeCanvas(256, 256)
  ctx.fillStyle = '#d8d8d8'
  ctx.fillRect(0, 0, 256, 256)
  grain(ctx, 256, 256, 30, 17)
  paperGrain = toTexture(canvas, false, true)
  paperGrain.repeat.set(3, 3)
  return paperGrain
}

let pageEdge: THREE.Texture | null = null

/** 금박 입힌 내지 단면 — 가는 종이 결 줄무늬 */
export function pageEdgeTexture() {
  if (pageEdge) return pageEdge
  const { canvas, ctx } = makeCanvas(8, 256)
  const rand = seeded(31)
  for (let y = 0; y < 256; y++) {
    const v = 200 + rand() * 40
    ctx.fillStyle = `rgb(${v},${v * 0.86},${v * 0.62})`
    ctx.fillRect(0, y, 8, 1)
  }
  pageEdge = toTexture(canvas, true, false)
  return pageEdge
}

/** 그라데이션 패널 (창 너머 빛 · 벽 니치용 emissive) */
export function verticalGradient(stops: [number, string][]) {
  const { canvas, ctx } = makeCanvas(4, 256)
  const g = ctx.createLinearGradient(0, 256, 0, 0)
  for (const [at, c] of stops) g.addColorStop(at, c)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  return toTexture(canvas)
}

/** 텍스처 사용 후 해제 */
export function disposeTextures(list: (THREE.Texture | undefined | null)[]) {
  for (const t of list) t?.dispose()
}

