import ping from 'ping'

export default async function (ip: string) {
  try {
    const response = await ping.promise.probe(ip)
    if (response.alive) {
      return response.time
    }
  } catch {}

  return -1
}
