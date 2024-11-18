import type { Ip, LatencyRecord } from '@prisma/client'
import { compact, groupBy, last, map, max, min } from 'lodash-es'
import { prisma } from '../plugins/prisma'
import type { RecordResult } from '../types/index'
import { calculateAverage, calculateStd } from '../utils/math'

export function filterRecords(records: (LatencyRecord & { ip: Ip })[]): RecordResult[] {
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

    const lastItem = last(items)
    return {
      label,
      values,
      packetLossRate,
      average: average.toFixed(1),
      std: std.toFixed(1),
      createdAt: lastItem?.createdAt.toISOString(),
      minValue: min(times) ?? Infinity,
      maxValue: max(times) ?? -Infinity,
    }
  })

  return compact(data)
}

export async function getRecordsByIp(query: { gt: string; lt: string; ip?: string }) {
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
