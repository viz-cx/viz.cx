export function titleFromText(text: string, limit: number = 65): string {
  if (!text) {
    return ""
  }
  if (text.length <= limit) {
    return text
  }
  let delimiters = [",", ".", ";"]
  for (let i = limit; i > 0; i--) {
    if (text.charAt(i) === " " && delimiters.includes(text.charAt(i - 1))) {
      return text.substring(0, i - 1) + "..."
    }
  }
  return text.substring(0, limit) + "..."
}
