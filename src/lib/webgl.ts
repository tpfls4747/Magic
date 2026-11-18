/** WebGL 을 쓸 수 있는 환경인지 미리 확인합니다 (렌더러를 만들기 전에). */
export function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    // 확인용 컨텍스트는 바로 돌려줍니다 (브라우저의 동시 WebGL 컨텍스트 수 제한)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}
