import { nanoid } from 'nanoid'
import type { Task } from '../plugins/cache.js'

export function createTask(): Task {
  return { label: nanoid(6), value: 0, createdAt: new Date() }
}
