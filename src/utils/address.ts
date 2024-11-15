import ip from 'ip'

export function getSubnetIps(cidr: string) {
  const subnet = ip.cidrSubnet(cidr)
  const startIp = ip.toLong(subnet.networkAddress)
  const endIp = ip.toLong(subnet.broadcastAddress)
  return Array.from({ length: endIp - startIp }, (_, i) => ip.fromLong(i + startIp))
}

export async function fetchTargetIps() {
  const res = await fetch('https://www.cloudflare.com/ips-v4')
  const rangeText = await res.text()
  const ipArr = rangeText
    .split('\n')
    .map(getSubnetIps)
    .flat()
    .filter(ip => ip.endsWith('.0'))
  return ipArr
}
