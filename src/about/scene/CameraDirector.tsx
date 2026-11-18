import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { DiaryAnim } from './diaryAnim'
import { DESK, DIARY, DIARY_PLACEMENT } from './layout'

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

/** 수평 화각 기준으로 폭 width 를 화면에 담는 거리 */
function fitDistance(width: number, height: number, fovDeg: number, aspect: number) {
  const vHalf = THREE.MathUtils.degToRad(fovDeg) / 2
  const hHalf = Math.atan(Math.tan(vHalf) * aspect)
  return Math.max(width / 2 / Math.tan(hHalf), height / 2 / Math.tan(vHalf))
}

/**
 * 시네마틱 카메라.
 * - 책상 구도: 책상을 약간 위에서 내려다보는 비스듬한 구도 (화면 비율에 맞춰 거리 자동 조정)
 * - 다이어리 근접: 펼침면을 거의 위에서, 글자가 읽히도록 화면 가득 담음
 * 다이어리 타임라인(anim.cam)에 맞춰 두 구도 사이를 보간하고,
 * 책상 구도에서는 마우스 위치에 따라 아주 미세하게 시점이 움직입니다.
 */
export function CameraDirector({
  anim,
  reducedMotion,
  readingInset,
}: {
  anim: DiaryAnim
  reducedMotion: boolean
  /** 근접 구도에서 화면 아래쪽에 남겨 둘 비율 (컨트롤 영역) */
  readingInset: number
}) {
  const parallax = useRef(new THREE.Vector2())

  useFrame((state, dt) => {
    const camera = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / Math.max(1, state.size.height)
    const portrait = aspect < 1

    // ── 책상 구도
    camera.fov = portrait ? 40 : 30
    // 넓은 화면에서는 왼쪽 소개 글을 피해 책상이 화면 오른쪽에 오도록
    // 세로 화면에서는 위쪽 소개 글 · 아래쪽 버튼 사이에 책상이 오도록 시선을 뒤로 둡니다
    const deskTarget = new THREE.Vector3(portrait ? -0.04 : -0.1, DESK.top - 0.03, portrait ? -0.17 : -0.04)
    const deskDir = new THREE.Vector3(0, portrait ? 0.95 : 0.56, 1).normalize()
    const deskDist = Math.max(portrait ? 1.6 : 1.55, fitDistance(portrait ? 0.82 : 1.62, 0.62, camera.fov, aspect))
    const deskPos = deskTarget.clone().addScaledVector(deskDir, deskDist)

    // ── 다이어리 근접 구도 (펼침면 중앙 위)
    const o = DIARY_PLACEMENT.open
    const spreadW = DIARY.coverW * 2 + (portrait ? 0.06 : 0.03)
    const spreadH = DIARY.coverH + 0.025
    const tilt = THREE.MathUtils.degToRad(portrait ? 12 : 20)
    const readDist = fitDistance(spreadW, spreadH / (1 - readingInset), camera.fov, aspect)
    const readTarget = new THREE.Vector3(o.x, DESK.top + 0.014, o.z + spreadH * readingInset * 0.5)
    const readPos = readTarget
      .clone()
      .add(new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)).multiplyScalar(readDist))

    // ── 보간
    const m = anim.cam
    tmpPos.lerpVectors(deskPos, readPos, m)
    tmpTarget.lerpVectors(deskTarget, readTarget, m)
    // 이동 중에는 살짝 위로 호를 그리며 다가감
    tmpPos.y += Math.sin(Math.PI * m) * 0.06

    if (!reducedMotion) {
      const want = state.pointer
      parallax.current.x = THREE.MathUtils.damp(parallax.current.x, want.x, 2.5, dt)
      parallax.current.y = THREE.MathUtils.damp(parallax.current.y, want.y, 2.5, dt)
      const k = 1 - m
      tmpPos.x += parallax.current.x * 0.05 * k
      tmpPos.y += parallax.current.y * 0.025 * k
    }

    camera.position.copy(tmpPos)
    camera.lookAt(tmpTarget)
    camera.updateProjectionMatrix()
  })

  return null
}
