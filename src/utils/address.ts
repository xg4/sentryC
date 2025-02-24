import ip from 'ip'

export function getIpsByCidr(cidr: string) {
  const subnet = ip.cidrSubnet(cidr)
  const startIp = ip.toLong(subnet.networkAddress)
  const endIp = ip.toLong(subnet.broadcastAddress)
  return Array.from({ length: endIp - startIp }, (_, i) => ip.fromLong(i + startIp))
}
