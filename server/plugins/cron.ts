import { CronJob } from 'cron'
import { createTask, createTicket } from '../services/task'
import { cache } from './cache'

export const job = new CronJob(
  '0 * * * *',
  async function () {
    const values = [...cache.values()]
    const current = values.find(i => i.value !== 1)
    if (current) {
      return
    }
    const t = createTicket()
    console.debug(`<${t.label}> Cron running`)

    createTask(t)
  },
  null,
  true,
  'Asia/Shanghai',
)
