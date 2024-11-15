import { useQuery } from '@tanstack/react-query'
import { recordClient } from '../utils/request'

export default function useRecord(dateRange: string[]) {
  const [gt, lt] = dateRange

  return useQuery({
    queryKey: ['records', gt, lt],
    queryFn: async () => {
      const res = await recordClient.record.$get({
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
    queryKey: ['records', gt, lt, ip],
    queryFn: async () => {
      const res = await recordClient.record[':ip'].$get({
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
