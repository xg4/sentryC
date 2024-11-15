import { Piscina } from 'piscina'

export const worker = new Piscina({
  concurrentTasksPerWorker: 10,
  filename: new URL('../worker.ts', import.meta.url).href,
})
