import dayjs from 'dayjs'
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { groupBy, isEmpty, last, map, max, min } from 'lodash-es'
import { db } from '../db'
import { latencyRecordTable } from '../db/schema'
import { calculateAverage, calculateStd } from '../utils/math'

export function filterRecords(
  records: {
    latency: number
    createdAt: Date
    id: string
    ipAddress: string
  }[],
) {
  const grouped = groupBy(records, 'ipAddress')

  const data = map(grouped, (items, label) => {
    const values = map(items, 'latency')
    const times = values.filter(i => i > 0)
    const packetLossRate = (values.length - times.length) / values.length
    const average = isEmpty(times) ? -1 : calculateAverage(times)
    const std = isEmpty(times) ? -1 : calculateStd(times, average)
    const lastItem = last(items)
    return {
      label,
      values,
      packetLossRate,
      average,
      std,
      createdAt: lastItem?.createdAt.toISOString(),
      minValue: min(times) ?? Infinity,
      maxValue: max(times) ?? -Infinity,
    }
  })

  return data
}

export async function getRecordsByIp(query: { gt: string; lt: string; ip?: string }) {
  const { gt, lt, ip } = query

  const filters = [
    lte(latencyRecordTable.createdAt, dayjs(lt).toDate()),
    gte(latencyRecordTable.createdAt, dayjs(gt).toDate()),
  ]
  if (ip) filters.push(eq(latencyRecordTable.ipAddress, ip))
  return db
    .select()
    .from(latencyRecordTable)
    .where(and(...filters))
    .orderBy(desc(latencyRecordTable.createdAt))
}
