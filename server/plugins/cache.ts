import { LRUCache } from 'lru-cache'

export type Task = { label: string; value: number; createdAt: Date }

export const cache = new LRUCache<string, Task>({
  max: 500,
})
