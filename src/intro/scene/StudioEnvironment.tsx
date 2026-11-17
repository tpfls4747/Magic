import { Environment, Lightformer } from '@react-three/drei'

/**
 * 외부 HDR 파일 없이 라이트포머로 만든 스튜디오 반사 환경.
 * 어두운 모브 배경 위에 크림·라벤더·샴페인 빛 패널을 배치해
 * 금속 표면에 대비가 분명한 하이라이트와 은은한 라벤더 반사가 생깁니다.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#4d3f58']} />
      {/* 위쪽 큰 소프트박스 */}
      <Lightformer form="rect" intensity={2.4} color="#fff4e2" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
      {/* 왼쪽 라벤더 스트립 */}
      <Lightformer form="rect" intensity={2.2} color="#cbb8f0" position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
      {/* 오른쪽 크림 스트립 */}
      <Lightformer form="rect" intensity={1.8} color="#ffe7c2" position={[5, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[6, 1.6, 1]} />
      {/* 정면 링 — 둥근 하이라이트 */}
      <Lightformer form="ring" intensity={1.6} color="#fff8ec" position={[0, 0.5, 6]} scale={2.4} />
      {/* 아래쪽 반사광 (바닥에서 튀는 따뜻한 빛) */}
      <Lightformer form="rect" intensity={0.8} color="#e9cfa0" position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[8, 4, 1]} />
      {/* 뒤쪽 라벤더 원 */}
      <Lightformer form="circle" intensity={1.2} color="#b9a6e6" position={[2, 2, -6]} scale={3} />
    </Environment>
  )
}
