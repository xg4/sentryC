import { useQuery } from '@tanstack/react-query'
import { client } from '../utils/request'

export default function useRecord(dateRange: string[]) {
  const [after, before] = dateRange

  return useQuery({
    queryKey: ['records', dateRange],
    queryFn: async () => {
      const res = await client.api.record.$get({
        query: {
          after,
          before,
        },
      })
      return res.json()
    },
  })
}

export function useRecords(dateRange: string[], ip: string) {
  const [after, before] = dateRange

  return useQuery({
    queryKey: [ip, 'records', dateRange],
    queryFn: async () => {
      const res = await client.api.record[':ip'].$get({
        param: {
          ip,
        },
        query: {
          after,
          before,
        },
      })
      return res.json()
    },
  })
}
