export function isAuthenticated(): boolean {
  let login = useCookie("login")
  let regularKey = useCookie("regular")
  return !!login.value && !!regularKey.value
}
