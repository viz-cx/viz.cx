export function voiceLink(str: string, leadingSlash: boolean = true): string {
  if (str.includes("viz://")) {
    let replacer = ""
    if (leadingSlash) {
      replacer = "/"
    }
    return str.replace("viz://", replacer).replace(/\/$/, "")
  }
  return str
}

export function isURL(str: string): boolean {
  let url
  try {
    url = new URL(str)
  } catch (_) {
    return false
  }
  return url.protocol === "http:" || url.protocol === "https:"
}
