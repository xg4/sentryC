import { Piscina } from 'piscina'
import { ProcessEnv } from '../env'

export const piscina = new Piscina({
  concurrentTasksPerWorker: ProcessEnv.WORKER_CONCURRENCY,
  filename: new URL('../worker.ts', import.meta.url).href,
})
