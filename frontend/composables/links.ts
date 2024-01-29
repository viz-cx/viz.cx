export function voiceLink(str: string, leadingSlash: boolean = true): string {
  const { author, block } = parseVoiceLink(str)
  if (author && block) {
    return `${leadingSlash ? "/" : ""}@${author}/${block}`
  }
  return ""
}

function parseVoiceLink(str: string): {
  author: string | null
  block: string | null
} {
  const regexp = /viz:\/\/\@([a-z0-9\-\.]+)\/(\d+)/g
  const result = regexp.exec(str)
  if (result && result.length >= 2) {
    return { author: result[1], block: result[2] }
  }
  return { author: null, block: null }
}

export function isCorrectVoiceLink(str: string): boolean {
  const result = parseVoiceLink(str)
  return result.author !== null && result.block !== null
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

export function postId(post: any): string {
  if (!post) {
    return ""
  }
  return `@${post.author}/${post.block}`
}
