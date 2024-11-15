import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { filterRecords, getRecordsByIp } from '../services/record.js'

export const recordRoute = new Hono()

export const queryRecordSchema = z.object({
  gt: z.string().datetime(),
  lt: z.string().datetime(),
})

recordRoute
  .get('/', zValidator('query', queryRecordSchema), async c => {
    const query = c.req.valid('query')
    const records = await getRecordsByIp(query)
    return c.json(filterRecords(records))
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
