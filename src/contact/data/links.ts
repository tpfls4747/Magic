/**
 * 실제 연락처. ⚠ 아직 제공되지 않아 비워 두었습니다 — 임의로 채우지 마세요.
 *
 * 값을 넣으면 버튼이 즉시 활성화됩니다.
 *   email:    'name@example.com' 형식
 *   linkedin: 'https://www.linkedin.com/in/...' 형식 (https:// 로 시작)
 */
export interface ContactLinks {
  email: string
  linkedin: string
}

export const CONTACT_LINKS: ContactLinks = {
  email: '',
  linkedin: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 유효한 이메일이면 mailto: 링크, 아니면 null (→ '준비 중') */
export function mailtoHref(email: string, subject: string): string | null {
  const e = email.trim()
  if (!EMAIL_RE.test(e)) return null
  return `mailto:${e}?subject=${encodeURIComponent(subject)}`
}

/** https:// 로 시작하는 주소만 허용, 아니면 null (→ '준비 중') */
export function linkedinHref(url: string): string | null {
  const u = url.trim()
  if (!/^https:\/\/[^\s]+$/i.test(u)) return null
  return u
}

/** 화면에 보여 줄 짧은 주소 (https://www. 제거) */
export function displayUrl(url: string) {
  return url.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}
