import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { filterRecords, getRecordsByIp } from '../services/record'

export const queryRecordSchema = z.object({
  gt: z.string().datetime(),
  lt: z.string().datetime(),
})

export const recordRoute = new Hono()
  .get('/', zValidator('query', queryRecordSchema), async c => {
    const query = c.req.valid('query')
    const records = await getRecordsByIp(query)

    const filtered = filterRecords(records).filter(
      i => i.packetLossRate <= 0.5 && i.average <= 200 && !i.values.every(j => j < 0),
    )
    return c.json(filtered)
  })
  .get(
    '/:ip',
    zValidator('query', queryRecordSchema),
    zValidator(
      'param',
      z.object({
        ip: z.string().ip(),
      }),
    ),
    async c => {
      const query = c.req.valid('query')
      const params = c.req.valid('param')
      const records = await getRecordsByIp({ ...query, ...params })
      return c.json(records)
    },
  )
