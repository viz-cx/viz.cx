export function readingTime(text: string): string {
  const wordsArray = text.split(" ")
  const wordCount = wordsArray.length
  const wordsPerMinute = 200
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  switch (readingTime) {
    case 0:
      return "less than a minute"
    case 1:
      return `about ${readingTime} minute`
    default:
      return `about ${readingTime} minutes`
  }
}
