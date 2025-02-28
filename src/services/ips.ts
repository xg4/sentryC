import dayjs from 'dayjs'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { compact } from 'lodash-es'
import type { Logger } from 'pino'
import { db } from '../db'
import { ipAddresses, pingResults } from '../db/schema'
import { piscina } from '../utils/piscina'

export const getIps = async () => {
  return db.query.ipAddresses.findMany()
}

export async function calculateIpRank(_limit: number = 10) {
  const query = sql`
    WITH ping_stats AS (
      SELECT
        pr.ip_address AS "ipAddress",
        AVG(pr.latency) AS avg_latency,
        STDDEV(pr.latency) AS stddev_latency,
        COUNT(*) AS total_requests,
        SUM(CASE WHEN pr.latency IS NULL THEN 1 ELSE 0 END) AS packet_loss_count,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pr.latency) AS p95_latency
      FROM
        ping_results pr
      WHERE
        pr.created_at >= NOW() - INTERVAL '1 day'
      GROUP BY
        pr.ip_address
    ),
    scored_stats AS (
      SELECT
        ps."ipAddress",
        ps.avg_latency,
        ps.stddev_latency,
        ps.p95_latency,
        ps.total_requests,
        (ps.packet_loss_count::float / ps.total_requests) * 100 AS packet_loss_percentage,
        -- 综合得分计算 (得分越低越好)
        -- 权重可以根据需要调整
        (
          -- 平均延迟 (延迟越低越好，以50ms为基准)
          COALESCE(ps.avg_latency / 300, 1) * 30 +
          COALESCE(ps.p95_latency / 300, 1) * 30 +
          -- 延迟稳定性 (标准差越低越好，以10ms为基准)
          COALESCE(ps.stddev_latency / 50, 1) * 10 +
          -- 丢包率 (丢包率越低越好)
          COALESCE((ps.packet_loss_count::float / ps.total_requests) * 100, 5) * 20 +
          -- 请求数量 (请求数量越多数据越可靠，用请求倒数作为惩罚因子，以24为基准)
          LEAST(12.0 / ps.total_requests, 1) * 10
        ) AS score
      FROM
        ping_stats ps
      WHERE
        -- 过滤总请求数小于12的IP
        ps.total_requests >= 12
        AND
        ps.stddev_latency <= 50
        AND
        ps.p95_latency <= 300
        AND
        ps.avg_latency <= 300
        AND
        -- 过滤丢包率大于5%的IP
        (ps.packet_loss_count::float / ps.total_requests) * 100 <= 5
    )
    SELECT
      ss."ipAddress",
      ss.p95_latency AS "p95",
      ss.stddev_latency AS "stddev",
      ss.total_requests AS "total",
      ss.packet_loss_percentage AS "PLR",
      ss.avg_latency AS "avg",
      ia.cidr,
      ss.score
    FROM
      scored_stats ss
    JOIN
      ip_addresses ia ON ss."ipAddress" = ia.ip
    ORDER BY
      ss.score ASC
  `

  const results = await db.execute(query)

  return results
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

export async function createTask(logger: Logger) {
  const ips = await db
    .select({
      ipAddress: ipAddresses.ip,
    })
    .from(ipAddresses)

  const validIps = await Promise.all(ips.map(i => checkIp(i.ipAddress))).then(compact)

  if (!validIps.length) {
    logger.info('有效的 ips 为空')
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
    logger.info(`任务结束 null`)
    return
  }
  logger.info(`任务结束 ${list.length}/${results.length}`)

  await db.insert(pingResults).values(results)
}
