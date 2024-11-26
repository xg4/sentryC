import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { cache } from '../plugins/cache'
import { queue } from '../plugins/queue'
import { createTask, createTicket } from '../services/task'

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

          await stream.sleep(2_000)
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

    const t = createTicket()
    cache.set(t.label, t)

    queue.add(async () => {
      await createTask(t)
    })

    return c.json(t.label, 201)
  })
