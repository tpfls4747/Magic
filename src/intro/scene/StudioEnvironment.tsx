import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

/**
 * 외부 HDR 파일 없이 라이트포머로 만든 스튜디오 반사 환경.
 *
 * 금속은 "무엇을 비추는가"가 곧 색입니다. 그래서
 *  - 배경은 너무 어둡지 않은 따뜻한 모브 톤(갈색으로 죽지 않게),
 *  - 정면(+Z)에는 넓은 크림 소프트박스를 두어 카메라를 향한 평평한 앞면이
 *    어느 거리·각도에서도 밝은 샴페인 골드로 보이게 하고 (확대 중 갑자기 어두워지는 현상 방지),
 *  - 위·좌우의 좁은 스트립으로 베벨과 테두리에 선명한 하이라이트 선을 만듭니다.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#77636f']} />
      {/* 위아래 그라데이션 돔: 위는 라벤더 그늘, 아래는 따뜻한 반사광 */}
      <mesh scale={40}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial side={THREE.BackSide} color="#71606c" />
      </mesh>
      {/* 정면 대형 소프트박스 — 앞면 반사의 기본 밝기 (확대 중에도 어두워지지 않도록) */}
      <Lightformer form="rect" intensity={0.75} color="#ffefd6" position={[0, 0.5, 7]} scale={[10, 6, 1]} />
      {/* 정면 세로 스트립 2개 — 평평한 앞면에 금속다운 밝고 어두운 띠를 만듦 */}
      <Lightformer form="rect" intensity={2.6} color="#fff6e8" position={[-2.2, 0.5, 6.5]} scale={[0.7, 8, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#f3e4ff" position={[2.6, 0.5, 6.5]} scale={[0.45, 8, 1]} />
      {/* 정면 링 — 둥근 반짝임 */}
      <Lightformer form="ring" intensity={2.2} color="#fffaf0" position={[1.2, 1.4, 5.5]} scale={1.2} />
      {/* 위쪽 소프트박스 */}
      <Lightformer form="rect" intensity={2.4} color="#fff4e2" position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
      {/* 왼쪽 라벤더 스트립 */}
      <Lightformer form="rect" intensity={2.0} color="#cbb8f0" position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[7, 1.1, 1]} />
      {/* 오른쪽 크림 스트립 */}
      <Lightformer form="rect" intensity={2.0} color="#ffe7c2" position={[6, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[7, 1.4, 1]} />
      {/* 아래쪽 따뜻한 반사광 */}
      <Lightformer form="rect" intensity={1.0} color="#efd2a2" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[9, 4, 1]} />
      {/* 뒤쪽 라벤더 원 */}
      <Lightformer form="circle" intensity={1.2} color="#b9a6e6" position={[2, 2, -7]} scale={3} />
    </Environment>
  )
}
