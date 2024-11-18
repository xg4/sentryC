import { isEmpty } from 'lodash-es'
import { prisma } from '../plugins/prisma'
import { fetchTargetIps } from '../utils/address'

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
