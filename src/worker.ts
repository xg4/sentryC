import ping from 'ping'

export default async function (ip: string) {
  try {
    const response = await ping.promise.probe(ip)
    if (response.alive) {
      if (response.time === 'unknown') {
        return null
      }
      return response.time
    }
  } catch {}
  return null
}
