import { PrismaClient } from '@prisma/client'
import { compact, groupBy, last, map, max, min } from 'lodash-es'
import { calculateAverage, calculateStd } from '../utils/math.mjs'

/**
 * @typedef {import('@prisma/client').LatencyRecord & { ip: import('@prisma/client').Ip }} LatencyRecordWithIp
 */

/**
 * 过滤和处理一组记录
 * @param {LatencyRecordWithIp[]} records - 包含记录的数组
 * @returns {Array} - 处理后的记录数组
 */
export function filterRecords(records) {
  const grouped = groupBy(records, 'ip.address')

  const data = map(grouped, (items, label) => {
    const values = map(items, 'latency')
    if (values.every(i => i < 0)) {
      return null
    }
    const times = values.filter(i => i > 0)
    if (times.length < 1) {
      return null
    }
    const packetLossRate = (values.length - times.length) / values.length
    if (packetLossRate > 0.5) {
      return null
    }
    const average = calculateAverage(times)

    if (average > 200) {
      return null
    }
    const std = calculateStd(times, average)
    return {
      label,
      values,
      packetLossRate,
      average: average.toFixed(1),
      std: std.toFixed(1),
      createdAt: last(items).createdAt,
      minValue: min(times) ?? Infinity,
      maxValue: max(times) ?? -Infinity,
    }
  })

  return compact(data)
}

/**
 * 根据 IP 地址获取数据库中的所有记录
 * @param {PrismaClient} prisma - Prisma 客户端实例
 * @param {Object} query - 查询对象，包含 gt、lt 和 ip 三个属性
 * @param {string} query.gt - 大于某个时间的记录
 * @param {string} query.lt - 小于某个时间的记录
 * @param {string?} query.ip - 要查询的 IP 地址
 * @returns {Promise<LatencyRecordWithIp[]>} - 包含所有记录的数组
 */
export async function getRecordsByIp(prisma, query) {
  const { gt, lt, ip } = query
  return prisma.latencyRecord.findMany({
    where: {
      ip: { address: ip },
      createdAt: {
        gt,
        lt,
      },
    },
    include: {
      ip: true,
    },
    orderBy: {
      id: 'desc',
    },
  })
}
