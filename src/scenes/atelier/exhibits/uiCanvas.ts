import * as THREE from 'three'

/** 화면 UI 를 캔버스로 그려 텍스처로 만드는 공용 헬퍼 (스마트폰·브라우저 화면 등) */

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

/** 논리 픽셀 w×h 를 scale 배 해상도로 그린 sRGB 캔버스 텍스처 */
export function canvasTexture(w: number, h: number, scale: number, draw: Draw) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** 떠오른 카드 아래에 드리우는 부드러운 그림자 (모든 카드가 공유, 크기에 맞게 늘려 씀) */
export function createCardShadowTexture() {
  return canvasTexture(64, 64, 2, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32)
    g.addColorStop(0, 'rgba(40, 30, 60, 0.9)')
    g.addColorStop(0.55, 'rgba(40, 30, 60, 0.45)')
    g.addColorStop(1, 'rgba(40, 30, 60, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  })
}
