import { LRUCache } from 'lru-cache'
import type { Ticket } from '../types'

export const cache = new LRUCache<string, Ticket>({
  max: 500,
})
