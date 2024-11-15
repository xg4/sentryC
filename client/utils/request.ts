import { hc } from 'hono/client'
import type { RecordRouteType } from '../../server/routes/record'
import type { TaskRouteType } from '../../server/routes/task'

export const recordClient = hc<RecordRouteType>('/api')

export const taskClient = hc<TaskRouteType>('/api')
