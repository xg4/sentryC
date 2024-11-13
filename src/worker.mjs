import ping from 'ping'

export default async function (ip) {
  try {
    const response = await ping.promise.probe(ip)
    if (response.alive) {
      return response.time
    }
  } catch {}

  return -1
}
