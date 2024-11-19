import { useQuery } from '@tanstack/react-query'
import { client } from '../utils/request'

export default function useRecord(dateRange: string[]) {
  const [gt, lt] = dateRange

  return useQuery({
    queryKey: ['records', dateRange],
    queryFn: async () => {
      const res = await client.api.record.$get({
        query: {
          gt,
          lt,
        },
      })
      return res.json()
    },
  })
}

export function useRecords(dateRange: string[], ip: string) {
  const [gt, lt] = dateRange

  return useQuery({
    queryKey: ['records', dateRange, ip],
    queryFn: async () => {
      const res = await client.api.record[':ip'].$get({
        param: {
          ip,
        },
        query: {
          gt,
          lt,
        },
      })
      return res.json()
    },
  })
}
