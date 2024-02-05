export function isAuthenticated(): boolean {
  let login = useCookie("login").value
  let regularKey = useCookie("regular").value
  return !!login && !!regularKey
}
