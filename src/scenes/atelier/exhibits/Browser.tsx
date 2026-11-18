import { forwardRef, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { goldTrimMaterial } from '../materials'
import { BROWSER, BROWSER_FACE_Z, SCREEN, SCREEN_LIP, TOOLBAR } from './browserGeometry'
import { roundedFrameShape, roundedRectGeometry, roundedRectShape } from './shapes'
import { canvasTexture } from './uiCanvas'

/**
 * 전시용 3D 브라우저 창.
 * 프레임·툴바·주소창·화면 테두리·유리까지 모두 실제 지오메트리이고,
 * 화면에 표시할 웹페이지는 children 으로 받아 화면 좌표계(화면 중심 원점, z=0 이 화면 표면) 안에 둡니다.
 * → 웹페이지를 실제 작업물로 바꿔도 이 모델은 그대로 씁니다.
 */

const { width: W, height: H, depth: D, cornerRadius: R, bevel: B } = BROWSER

let shared: ReturnType<typeof build> | null = null

function build() {
  const coreDepth = D - B * 2
  const body = new THREE.ExtrudeGeometry(roundedRectShape(W - B * 2, H - B * 2, R - B), {
    depth: coreDepth,
    bevelEnabled: true,
    bevelThickness: B,
    bevelSize: B,
    bevelSegments: 6,
    curveSegments: 24,
  })
  body.translate(0, 0, -coreDepth / 2)

  // 툴바 판 — 앞면에서 살짝 돌출
  const toolbar = new THREE.ExtrudeGeometry(roundedRectShape(TOOLBAR.width, TOOLBAR.height, 0.022), {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 12,
  })
  const toolbarFace = roundedRectGeometry(TOOLBAR.width, TOOLBAR.height, 0.022, 8)

  // 주소창 — 툴바 위에 오목한 캡슐
  const address = new THREE.ExtrudeGeometry(roundedRectShape(ADDRESS.w, ADDRESS.h, ADDRESS.h / 2), {
    depth: 0.0012,
    bevelEnabled: false,
    curveSegments: 16,
  })
  const addressFace = roundedRectGeometry(ADDRESS.w, ADDRESS.h, ADDRESS.h / 2, 8)

  // 창 버튼 (작은 원판)
  const dot = new THREE.CylinderGeometry(0.0078, 0.0078, 0.003, 28)
  dot.rotateX(Math.PI / 2)

  // 화면을 두르는 낮은 턱 (아이보리) + 그 안쪽 가장자리의 가는 금색 선
  const { band, height } = SCREEN_LIP
  const lip = new THREE.ExtrudeGeometry(
    roundedFrameShape(SCREEN.width + band * 2, SCREEN.height + band * 2, SCREEN.radius + band, band),
    {
      depth: height - 0.0015,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0012,
      bevelSegments: 2,
      curveSegments: 14,
    },
  )
  const trim = new THREE.ExtrudeGeometry(
    roundedFrameShape(SCREEN.width + 0.006, SCREEN.height + 0.006, SCREEN.radius + 0.003, 0.0026),
    { depth: 0.0012, bevelEnabled: false, curveSegments: 12 },
  )
  const screen = roundedRectGeometry(SCREEN.width, SCREEN.height, SCREEN.radius, 10)

  return { body, toolbar, toolbarFace, address, addressFace, dot, lip, trim, screen }
}

const ADDRESS = { w: 0.6, h: 0.034, x: 0.02 }

/** 프레임 앞뒤 면 — 은은한 광택의 아이보리 새틴 */
const frameMaterial = new THREE.MeshPhysicalMaterial({
  color: '#f3ece1',
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.6,
  clearcoatRoughness: 0.22,
  envMapIntensity: 0.9,
})

/**
 * 측면(두께) 금속 — 갤러리 공용 샴페인 골드보다 거칠기를 조금 높이고 반사를 낮춘 브라우저 전용.
 * 넓은 측면과 둥근 모서리에서 하이라이트가 번쩍이지 않고 은은하게 흐르도록 합니다.
 */
const sideMetalMaterial = new THREE.MeshPhysicalMaterial({
  color: '#d4b47c',
  metalness: 1,
  roughness: 0.34,
  anisotropy: 0.35,
  clearcoat: 0.25,
  clearcoatRoughness: 0.2,
  envMapIntensity: 1.15,
})

/**
 * 브라우저 화면 유리 — 휴대폰용 유리보다 반사를 크게 낮춘 전용 재질.
 * 화면이 넓어 반사가 강하면 웹페이지 전체가 뿌옇게 밝아지므로, 가장자리 쪽 은은한 반사만 남깁니다.
 */
const browserGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#000000',
  roughness: 0.16,
  metalness: 0,
  // 클리어코트는 비스듬한 각도에서 반사가 하얗게 번지므로 쓰지 않음
  envMapIntensity: 0.4,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const toolbarMaterial = new THREE.MeshStandardMaterial({
  color: '#faf6ee',
  roughness: 0.5,
  envMapIntensity: 0.8,
})

const addressMaterial = new THREE.MeshStandardMaterial({
  color: '#ece4d7',
  roughness: 0.65,
})

/** 창 버튼 색 — 갤러리 팔레트에 맞춘 라벤더·샴페인·아이보리 */
const DOT_MATERIALS = ['#c9bbe6', '#dcc08e', '#eadfd0'].map(
  (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 }),
)

/** 툴바 아이콘(뒤로·앞으로·새로고침, 오른쪽 메뉴)과 주소창 글자 텍스처 */
function createChromeTextures(address: string) {
  const px = 1000
  const toolbarPxH = (TOOLBAR.height / TOOLBAR.width) * px
  const toolbar = canvasTexture(px, toolbarPxH, 2, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(47, 40, 54, 0.45)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    const cy = h / 2
    // ‹ › ↻ — 창 버튼 오른쪽
    const icons = [92, 118]
    icons.forEach((x, i) => {
      ctx.beginPath()
      const d = i === 0 ? -1 : 1
      ctx.moveTo(x - d * 3, cy - 7)
      ctx.lineTo(x + d * 3, cy)
      ctx.lineTo(x - d * 3, cy + 7)
      ctx.stroke()
    })
    ctx.beginPath()
    ctx.arc(148, cy, 7, Math.PI * 0.2, Math.PI * 1.75)
    ctx.stroke()
    // 오른쪽: 공유·메뉴
    ctx.beginPath()
    ctx.roundRect(w - 96, cy - 7, 14, 14, 3)
    ctx.stroke()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.arc(w - 48, cy + i * 6, 1.6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(47, 40, 54, 0.5)'
      ctx.fill()
    }
  })
  const aw = 600
  const ah = (ADDRESS.h / ADDRESS.w) * aw
  const addr = canvasTexture(aw, ah, 3, (ctx, w, h) => {
    // 자물쇠 대신 작은 원 — 보안 표시 아이콘처럼
    ctx.beginPath()
    ctx.arc(22, h / 2, 4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(127, 108, 179, 0.7)'
    ctx.fill()
    ctx.font = `500 15px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.fillStyle = 'rgba(47, 40, 54, 0.72)'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(address, w / 2, h / 2 + 1)
  })
  return { toolbar, addr }
}

export interface BrowserProps {
  address: string
  castShadow?: boolean
  /** 화면 콘텐츠 (화면 중심 원점, z=0 이 화면 표면, +z 가 바깥) */
  children?: ReactNode
}

export const Browser = forwardRef<THREE.Group, BrowserProps>(function Browser(
  { address, castShadow = true, children },
  ref,
) {
  shared ??= build()
  const g = shared
  const chrome = useMemo(() => createChromeTextures(address), [address])
  useEffect(
    () => () => {
      chrome.toolbar.dispose()
      chrome.addr.dispose()
    },
    [chrome],
  )

  const faceZ = BROWSER_FACE_Z
  const dotX = -TOOLBAR.width / 2 + 0.03

  return (
    <group ref={ref}>
      {/* 프레임: 앞뒤 면은 아이보리 새틴, 옆면(두께)과 둥근 모서리는 샴페인 골드 */}
      <mesh
        geometry={g.body}
        material={[frameMaterial, sideMetalMaterial]}
        castShadow={castShadow}
        receiveShadow
      />

      {/* 툴바 */}
      <group position={[0, TOOLBAR.centerY, faceZ]}>
        <mesh geometry={g.toolbar} material={toolbarMaterial} receiveShadow />
        <mesh geometry={g.toolbarFace} position-z={0.0047}>
          <meshBasicMaterial map={chrome.toolbar} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        {DOT_MATERIALS.map((m, i) => (
          <mesh key={i} geometry={g.dot} material={m} position={[dotX + i * 0.024, 0, 0.0058]} />
        ))}
        <group position={[ADDRESS.x, 0, 0.0046]}>
          <mesh geometry={g.address} material={addressMaterial} />
          <mesh geometry={g.addressFace} position-z={0.0014}>
            <meshBasicMaterial map={chrome.addr} transparent toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      </group>

      {/* 화면: 낮은 턱 안쪽에 앉은 웹페이지(children) + 유리 — 턱이 화면보다 6mm 높아 깊이 차이가 생김 */}
      <group position={[0, SCREEN.centerY, faceZ]}>
        <mesh geometry={g.lip} material={frameMaterial} castShadow={false} receiveShadow />
        <mesh geometry={g.trim} material={goldTrimMaterial} position-z={SCREEN_LIP.height + 0.0002} />
        <mesh geometry={g.screen} position-z={0.0006}>
          <meshBasicMaterial color="#e9e3d9" toneMapped={false} />
        </mesh>
        <group position-z={0.0012}>{children}</group>
        <mesh geometry={g.screen} material={browserGlassMaterial} position-z={0.0042} renderOrder={20} />
      </group>
    </group>
  )
})
