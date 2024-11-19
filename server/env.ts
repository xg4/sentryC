import { z } from 'zod'

const ServeEnv = z.object({
  PORT: z.coerce.number().int().default(8970),
  HOSTNAME: z.string().default('localhost'),
  WORKER_CONCURRENCY: z.coerce.number().int().default(10),
})

export const ProcessEnv = ServeEnv.parse(process.env)
