import dayjs from 'dayjs'
import { and, eq, gte } from 'drizzle-orm'
import { compact, isEmpty } from 'lodash-es'
import { nanoid } from 'nanoid'
import { db } from '../db'
import { ipTable, latencyRecordTable } from '../db/schema'
import { cache } from '../plugins/cache'
import { worker } from '../plugins/piscina'
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

export async function createTask(t: Ticket) {
  const ips = await getAllIps()
  const _filterIps = await Promise.all(
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

      if (itemRecords.length >= 5) {
        const packetLossRate = (itemRecords.length - itemRecords.filter(i => i.latency > 0).length) / itemRecords.length
        if (packetLossRate >= 0.5) {
          return null
        }
      }
      return ip
    }),
  )

  const filterIps = compact(_filterIps)

  let index = 0
  const records = await Promise.all(
    filterIps.map(async ip => {
      const latency: number = await worker.run(ip.address)
      const saved = cache.get(t.label)
      if (saved) {
        saved.value = ++index / filterIps.length
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
    console.error(`<${t.label}> Task failed`)
    return
  }
  console.info(`<${t.label}> Task ${list.length}/${records.length}`)
  await db.insert(latencyRecordTable).values(
    records.map(i => ({
      ipAddress: i.address,
      latency: i.latency,
    })),
  )
}
