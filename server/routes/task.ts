import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { isEmpty } from 'lodash-es'
import { z } from 'zod'
import { db } from '../db'
import { latencyRecordTable } from '../db/schema'
import { cache } from '../plugins/cache'
import { worker } from '../plugins/piscina'
import { queue } from '../plugins/queue'
import { getAllIps } from '../services/task'
import { createTask } from '../utils/task'

export const taskRoute = new Hono()
  .get('/', async c => {
    return c.json([...cache.values()])
  })
  .get(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.string(),
      }),
    ),
    async c => {
      return streamSSE(c, async stream => {
        const { id } = c.req.valid('param')
        stream.onAbort(() => {
          stream.close()
        })
        while (!(stream.aborted || stream.closed)) {
          const progress = cache.get(id)
          if (!progress) {
            return stream.close()
          }

          await stream.writeSSE({
            data: JSON.stringify(progress.value),
          })

          if (progress.value === 1) {
            return stream.close()
          }

          await stream.sleep(5_000)
        }
      })
    },
  )
  .post('/', async c => {
    const values = [...cache.values()]
    const current = values.find(i => i.value !== 1)
    if (current) {
      return c.json(current.label)
    }

    const t = createTask()
    cache.set(t.label, t)

    queue.add(async () => {
      const ips = await getAllIps()
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
        console.error(`Task ${t.label}: failed`)
        return
      }
      console.info(`Task ${t.label}: ${list.length}/${records.length}`)
      await db.insert(latencyRecordTable).values(
        records.map(i => ({
          ipAddress: i.address,
          latency: i.latency,
        })),
      )
    })

    return c.json(t.label, 201)
  })
