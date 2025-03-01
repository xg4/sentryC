import { zValidator } from '@hono/zod-validator'
import { createInsertSchema } from 'drizzle-zod'
import { Hono } from 'hono'
import { chunk, isNumber } from 'lodash-es'
import UAParser from 'my-ua-parser'
import { table } from 'table'
import { z } from 'zod'
import { db } from '../db'
import { ipAddresses } from '../db/schema'
import { ipService } from '../services'
import { getIpsByCidr } from '../utils/address'

export const ipRouter = new Hono()
  .get('/ips', async c => {
    const ipAddresses = await ipService.getAllIpAddresses()
    return c.json(ipAddresses)
  })
  .post('/ips', zValidator('json', z.string().array()), async c => {
    const list = c.req.valid('json')
    const ipList = list
      .map(cidr => {
        const ips = getIpsByCidr(cidr)
        return ips.map(ip => ({ ip, cidr }))
      })
      .flat()
      .filter(i => i.ip.endsWith('.0'))
    const validData = createInsertSchema(ipAddresses).array().parse(ipList)
    await db.transaction(async tx => {
      const list = chunk(validData, 1 * 1e3)
      await Promise.all(
        list.map(async data => {
          await tx.insert(ipAddresses).values(data)
        }),
      )
    })

    return c.json({ success: true })
  })
  .get(
    '/rank',
    zValidator(
      'query',
      z.object({
        limit: z.coerce.number().default(10),
      }),
    ),
    async c => {
      const { limit } = c.req.valid('query')
      const userAgent = c.req.header('user-agent')
      const parser = new UAParser(userAgent)
      const isMobile = parser.getDevice().type === 'mobile'

      const results = await ipService.calculateIpPerformanceRanking(limit)
      const colLen = isMobile ? 4 : results.fields.length
      const rank = [
        results.fields.slice(0, colLen).map(f => f.name),
        ...results.rows.slice(0, limit).map(r =>
          results.fields.slice(0, colLen).map(f => {
            const v = r[f.name]
            if (isNumber(v)) {
              return v.toFixed(2)
            }
            return v
          }),
        ),
      ]
      return c.text(table(rank))
    },
  )
