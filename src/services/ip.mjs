import { getSubnetIps } from '../utils/ip.mjs'

let cache = null

export async function fetchTargetIps() {
  if (cache) {
    return cache
  }
  const res = await fetch('https://www.cloudflare.com/ips-v4')
  const rangeText = await res.text()
  const ipArr = rangeText
    .split('\n')
    .map(getSubnetIps)
    .flat()
    .filter(ip => ip.endsWith('.0'))
  cache = ipArr
  return ipArr
}
