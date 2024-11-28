import dayjs from 'dayjs'
import { and, desc, eq, gte } from 'drizzle-orm'
import { compact, isEmpty } from 'lodash-es'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { ipTable, latencyRecordTable } from '../db/schema'
import { cache } from '../plugins/cache'
import { worker } from '../plugins/worker'
import type { Ticket } from '../types'
import { fetchTargetIps } from '../utils/address'

export function createTicket(): Ticket {
  const ticket = { label: nanoid(6), value: 0, createdAt: new Date() }
  cache.set(ticket.label, ticket)
  return ticket
}

export async function getAllIps() {
  const ips = await db.select({ address: ipTable.address }).from(ipTable)
  if (isEmpty(ips)) {
    const remoteIps = await fetchTargetIps()
    console.log('remote ips: ', remoteIps.length)
    const allIps = await db
      .insert(ipTable)
      .values(
        remoteIps.map(address => ({
          address,
        })),
      )
      .returning({ address: ipTable.address })
    return allIps
  }
  return ips
}

async function filterValidIps(ips: { address: string }[]) {
  const _ips = await Promise.all(
    ips.map(async ip => {
      const itemRecords = await db
        .select({ latency: latencyRecordTable.latency })
        .from(latencyRecordTable)
        .where(
          and(
            eq(latencyRecordTable.ipAddress, ip.address),
            gte(latencyRecordTable.createdAt, dayjs().subtract(1, 'day').toDate()),
          ),
        )
        .orderBy(desc(latencyRecordTable.createdAt))

      if (itemRecords.length >= 5 && itemRecords.slice(0, 2).every(i => i.latency < 0)) {
        return
      }
      return ip
    }),
  )
  return compact(_ips)
}

export async function createTask(t: Ticket) {
  const ips = await getAllIps().then(filterValidIps)

  let index = 0
  const records = await Promise.all(
    ips.map(async ip => {
      const latency: number = await worker.run(ip.address)
      const saved = cache.get(t.label)
      if (saved) {
        saved.value = ++index / ips.length
        cache.set(saved.label, saved)
      }
      return {
        ...ip,
        latency,
      }
    }),
  )
  const list = records.filter(i => i.latency > 0)
  if (isEmpty(list)) {
    console.error(`Task: <${t.label}> failed`)
    return
  }
  console.info(`Task: <${t.label}> ${list.length}/${records.length}`)
  await db.insert(latencyRecordTable).values(
    records.map(i => ({
      ipAddress: i.address,
      latency: i.latency,
    })),
  )
}
