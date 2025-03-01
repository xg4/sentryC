import { CronJob } from 'cron'
import { nanoid } from 'nanoid'
import { logger } from '../middlewares/logger'
import { ipService } from '../services'

export const pingMonitorJob = new CronJob(
  '0 * * * *',
  async function () {
    const taskId = nanoid()

    const taskLogger = logger.child({
      taskType: 'ping-monitor',
      taskId,
    })

    taskLogger.info('开始执行 IP 监控任务')

    await ipService.createPingTask(taskLogger)
  },
  null,
  false,
  'Asia/Shanghai',
)

export const dataCleanupJob = new CronJob(
  '0 3 * * *',
  async function () {
    const taskId = nanoid()

    const taskLogger = logger.child({
      taskType: 'data-cleanup',
      taskId,
    })

    taskLogger.info('开始执行数据清理任务')
    await ipService.deleteOldPingResults(taskLogger)
  },
  null,
  false,
  'Asia/Shanghai',
)

export async function initSchedules() {
  pingMonitorJob.start()
  dataCleanupJob.start()
}
