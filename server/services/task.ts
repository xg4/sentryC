import { isEmpty } from 'lodash-es'
import { prisma } from '../plugins/prisma.js'
import { fetchTargetIps } from '../utils/address.js'

export async function getAllIps() {
  const ips = await prisma.ip.findMany()
  if (isEmpty(ips)) {
    const targetIps = await fetchTargetIps()
    await prisma.ip.createMany({
      data: targetIps.map(address => ({
        address,
      })),
    })
    return prisma.ip.findMany()
  }
  return ips
}
