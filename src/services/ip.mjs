import { PrismaClient } from '@prisma/client'
import { isEmpty } from 'lodash-es'
import { getSubnetIps } from '../utils/ip.mjs'

async function fetchTargetIps() {
  const res = await fetch('https://www.cloudflare.com/ips-v4')
  const rangeText = await res.text()
  const ipArr = rangeText
    .split('\n')
    .map(getSubnetIps)
    .flat()
    .filter(ip => ip.endsWith('.0'))
  return ipArr
}

/**
 * 获取数据库中所有的 IP 地址
 * @param {PrismaClient} prisma - Prisma 客户端实例
 * @returns {Promise<import('@prisma/client').Ip[]>} - 包含所有 IP 地址的数组
 */
export async function getAllIps(prisma) {
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
