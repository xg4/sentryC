import { Hono } from 'hono'
import { ipRouter } from './ips'

export const routes = new Hono().route('/', ipRouter)
