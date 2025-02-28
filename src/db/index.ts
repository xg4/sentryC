import { drizzle } from 'drizzle-orm/node-postgres'
import { ProcessEnv } from '../env'
import * as schema from './schema'

export const db = drizzle(ProcessEnv.DATABASE_URL, {
  schema,
})
