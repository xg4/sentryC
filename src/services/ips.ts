import dayjs from 'dayjs'
import { and, desc, eq, gte } from 'drizzle-orm'
import { compact, groupBy, max, mean, min, orderBy } from 'lodash-es'
import { db } from '../db'
import { ipAddresses, pingResults } from '../db/schema'
import { piscina } from '../utils/piscina'

export const getIps = async () => {
  return db.select().from(ipAddresses)
}

export async function calculateIpRank(limit: number = 10) {
  const oneDayAgo = dayjs().subtract(1, 'days').toDate()

  // 查询最近一天的 ping 结果数据
  const results = await db
    .select({
      ipAddress: pingResults.ipAddress,
      latency: pingResults.latency,
    })
    .from(pingResults)
    .where(gte(pingResults.createdAt, oneDayAgo))

  const ipStats = groupBy(results, 'ipAddress')

  const rank = Object.entries(ipStats).map(([ipAddress, stats]) => {
    const record = calculateItemRecord(stats.map(i => i.latency))
    return {
      ...record,
      ipAddress,
      count: stats.length,
    }
  })

  return orderBy(rank, ['average', 'lossRate', 'stddev'], ['asc', 'asc', 'asc']).slice(0, limit)
}

function calculateItemRecord(values: (number | null)[]) {
  const validValues = compact(values)

  const average = mean(validValues)
  const lossRate = 1 - validValues.length / values.length
  const maxValue = max(validValues)
  const minValue = min(validValues)
  const stddev = calculateStandardDeviation(validValues)

  return {
    average,
    lossRate,
    maxValue,
    minValue,
    stddev,
  }
}

// 计算标准差的辅助函数
function calculateStandardDeviation(data: number[]): number {
  if (data.length <= 1) {
    return 0
  }
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length
  const squaredDifferences = data.map(value => Math.pow(value - mean, 2))
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / (data.length - 1)
  return Math.sqrt(variance)
}

async function checkIp(ipAddress: string) {
  const itemRecords = await db
    .select({ latency: pingResults.latency })
    .from(pingResults)
    .where(and(eq(pingResults.ipAddress, ipAddress), gte(pingResults.createdAt, dayjs().subtract(1, 'day').toDate())))
    .orderBy(desc(pingResults.createdAt))

  if (itemRecords.length >= 5 && itemRecords.slice(0, 2).every(i => !i.latency)) {
    return null
  }
  return { ipAddress }
}

export async function createTask(requestId: string) {
  const ips = await db
    .select({
      ipAddress: ipAddresses.ip,
    })
    .from(ipAddresses)

  const validIps = await Promise.all(ips.map(i => checkIp(i.ipAddress))).then(compact)

  if (!validIps.length) {
    console.log(`Task: <${requestId}> empty`)
    return
  }

  const results = await Promise.all(
    validIps.map(async i => {
      const latency: number | null = await piscina.run(i.ipAddress)
      return {
        ...i,
        latency,
      }
    }),
  )
  const list = results.filter(i => i.latency && i.latency > 0)
  if (!list.length) {
    console.error(`Task: <${requestId}> failed`)
    return
  }
  console.info(`Task: <${requestId}> ${list.length}/${results.length}`)

  await db.insert(pingResults).values(results)
}
