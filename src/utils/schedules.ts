import { CronJob } from 'cron'
import { nanoid } from 'nanoid'
import { logger } from '../middlewares/logger'
import { ipService } from '../services'

export const job = new CronJob(
  '0 * * * *',
  async function () {
    const ticket = nanoid()

    const child = logger.child({
      type: 'add',
      ticket,
    })

    child.info('任务开始')

    await ipService.createTask(child)
  },
  null,
  false,
  'Asia/Shanghai',
)

export const cleanupJob = new CronJob(
  '0 12 * * *',
  async function () {
    const ticket = nanoid()

    const child = logger.child({
      type: 'delete',
      ticket,
    })

    child.info('任务开始')
    await ipService.deleteOldPingResults(child)
  },
  null,
  false,
  'Asia/Shanghai',
)

export async function initSchedules() {
  job.start()
  cleanupJob.start()
}
