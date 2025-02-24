import { CronJob } from 'cron'
import { nanoid } from 'nanoid'
import { ipService } from '../services'

export const job = new CronJob(
  '0 * * * *',
  async function () {
    const ticket = nanoid()
    console.debug(`Cron Job: Add <${ticket}>`)

    await ipService.createTask(ticket)
  },
  null,
  false,
  'Asia/Shanghai',
)

export async function initSchedules() {
  await job.start()
}
