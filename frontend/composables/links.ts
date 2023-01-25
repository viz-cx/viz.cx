export function voiceLink(str: string, leadingSlash: boolean = true): string {
  if (str.includes("viz://")) {
    let replacer = ''
    if (leadingSlash) {
        replacer = '/'
    }
    return str.replace("viz://", replacer).replace(/\/$/, "")
  }
  return str
}
