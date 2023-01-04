function getDateByPeriod(period: string): Date {
  let days: number
  switch (period) {
    case "Week":
      days = 7
      break
    case "Month":
      days = 30
      break
    case "Year":
      days = 365
      break
    case "All":
      days = 3650
      break
    default:
      days = 0
      break
  }
  return new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000)
}
