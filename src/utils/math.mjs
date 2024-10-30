export function calculateAverage(data) {
  return data.reduce((a, b) => a + b, 0) / data.length
}

export function calculateStd(data, mean) {
  const variance = data.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / data.length
  return Math.sqrt(variance)
}
