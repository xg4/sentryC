import dayjs from 'dayjs'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { compact } from 'lodash-es'
import type { Logger } from 'pino'
import { db } from '../db'
import { ipAddresses, pingResults } from '../db/schema'
import { piscina } from '../utils/piscina'

export const getAllIpAddresses = async () => {
  return db.query.ipAddresses.findMany()
}

export async function calculateIpPerformanceRanking(limit: number = 10) {
  const query = sql`
    WITH network_metrics AS (
      SELECT
        pr.ip_address AS "ipAddress",
        AVG(pr.latency) AS avg_latency,
        STDDEV(pr.latency) AS stddev_latency,
        COUNT(*) AS total_requests,
        (SUM(CASE WHEN pr.latency IS NULL THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS packet_loss,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pr.latency) AS p95_latency
      FROM
        ping_results pr
      WHERE
        pr.created_at >= NOW() - INTERVAL '1 day'
      GROUP BY
        pr.ip_address
    ),
    network_performance AS (
      SELECT
        nm."ipAddress",
        nm.avg_latency,
        nm.stddev_latency,
        nm.p95_latency,
        nm.total_requests,
        nm.packet_loss,
        -- 性能评分计算（分值越低越好）
        (
          -- 基础延迟评分 (50%)
          -- 平均延迟权重 20%
          COALESCE(nm.avg_latency / 300, 1) * 20 +
          -- P95延迟权重 30%
          COALESCE(nm.p95_latency / 300, 1) * 30 +
          
          -- 稳定性评分 (40%)
          -- 延迟标准差权重 15%
          COALESCE(nm.stddev_latency / 50, 1) * 20 +
          -- 丢包率权重 15%
          COALESCE(nm.packet_loss, 5) * 20 +
          
          -- 数据可靠性评分 (10%)
          -- 样本数量评分（样本越多越可靠）
          LEAST(12.0 / nm.total_requests, 1) * 10
        ) AS quality_score
      FROM
        network_metrics nm
      WHERE
        -- 基础质量要求
        nm.total_requests >= 12
        AND nm.stddev_latency <= 50
        AND nm.p95_latency <= 300
        AND nm.avg_latency <= 300
        AND nm.packet_loss <= 5
    )
    SELECT
      np."ipAddress",
      np.p95_latency AS "p95",
      np.stddev_latency AS "stddev",
      np.total_requests AS "total",
      np.packet_loss AS "PLR",
      np.avg_latency AS "avg",
      ia.cidr,
      np.quality_score AS score
    FROM
      network_performance np
    JOIN
      ip_addresses ia ON np."ipAddress" = ia.ip
    ORDER BY
      np.quality_score ASC
    LIMIT ${limit}
  `

  const results = await db.execute(query)

  return results
}

async function validateIpLatency(ipAddress: string) {
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

export async function deleteOldPingResults(logger: Logger) {
  try {
    // 计算一周前的日期和时间
    const oneWeekAgo = dayjs().subtract(7, 'days').toDate()

    // 构建删除查询
    const result = await db.delete(pingResults).where(lt(pingResults.createdAt, oneWeekAgo))

    logger.info(`Deleted ${result.rowCount} rows.`)
    return result.rowCount
  } catch (error) {
    logger.error('Error deleting old ping results:', error)
    throw error // 重新抛出错误，以便调用者处理
  }
}

export async function createPingTask(logger: Logger) {
  const ipList = await db
    .select({
      ipAddress: ipAddresses.ip,
    })
    .from(ipAddresses)

  const validIpAddresses = await Promise.all(ipList.map(i => validateIpLatency(i.ipAddress))).then(compact)

  if (!validIpAddresses.length) {
    logger.info('没有可用的 IP 地址')
    return
  }

  const results = await Promise.all(
    validIpAddresses.map(async i => {
      const latency: number | null = await piscina.run(i.ipAddress)
      return {
        ...i,
        latency,
      }
    }),
  )
  const list = results.filter(i => i.latency && i.latency > 0)
  if (!list.length) {
    logger.info(`任务结束 null`)
    return
  }
  logger.info(`任务结束 ${list.length}/${results.length}`)

  await db.insert(pingResults).values(results)
}
