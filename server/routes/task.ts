import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { isEmpty } from 'lodash-es'
import { z } from 'zod'
import { cache } from '../plugins/cache.js'
import { worker } from '../plugins/piscina.js'
import { prisma } from '../plugins/prisma.js'
import { queue } from '../plugins/queue.js'
import { getAllIps } from '../services/task.js'
import { createTask } from '../utils/task.js'

export const taskRoute = new Hono().basePath('/task')

const task = taskRoute
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
      const { id } = c.req.valid('param')
      const progress = cache.get(id)
      if (!progress) {
        return c.json(null, 404)
      }
      return c.json(progress.value)
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
          const latency = await worker.run(ip.address)
          const saved = cache.get(t.label) || createTask()
          saved.value = ++index / ips.length
          cache.set(saved.label, saved)
          return {
            ...ip,
            latency,
          }
        }),
      )
      const list = records.filter(i => i.latency > 0)
      if (isEmpty(list)) {
        // req.log.error(`task-${taskId} failed`)
        return
      }
      // req.log.info(`task-${taskId} ${list.length}/${records.length}`)

      await prisma.latencyRecord.createMany({
        data: records.map(i => ({
          ipId: i.id,
          latency: i.latency,
        })),
      })
    })

    return c.json(t.label, 201)
  })

export type TaskRouteType = typeof task
