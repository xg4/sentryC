import { CronJob } from 'cron'
import dayjs from 'dayjs'
import { deleteRecords } from '../services/record'
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
    console.debug(`Cron Job: Add <${t.label}>`)

    await createTask(t)
  },
  null,
  true,
  'Asia/Shanghai',
)

export const deleteRecordsJob = new CronJob(
  '30 0 * * *',
  async function () {
    const result = await deleteRecords({ before: dayjs().subtract(2, 'day').startOf('day').toISOString() })
    console.debug(`Cron Job: Deleted ${result.rowsAffected} records.`)
  },
  null,
  true,
  'Asia/Shanghai',
)
