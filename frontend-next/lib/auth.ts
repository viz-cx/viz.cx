export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

export function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function isAuthenticated(): boolean {
  return !!getCookie("login") && !!getCookie("regular")
}

export function getLogin(): string {
  return getCookie("login") || ""
}

export function getWif(): string {
  return getCookie("regular") || ""
}

export function getAvatar(): string | undefined {
  return getCookie("avatar")
}
