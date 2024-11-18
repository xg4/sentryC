import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, List, Progress } from 'antd'
import clsx from 'clsx'
import dayjs from 'dayjs'
import { orderBy } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import { today } from '../constants'
import { client } from '../utils/request'

export default function TaskList({ className }: { className?: string }) {
  const { mutate: start, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.api.task.$post()
      return res.json()
    },
    onSuccess() {
      refetch()
    },
  })

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await client.api.task.$get()
      return res.json()
    },
    select: data => orderBy(data, [item => item.createdAt], ['desc']),
  })

  return (
    <List
      className={className}
      header={
        <Button
          type="primary"
          disabled={data?.some(i => i.value !== 1)}
          size="small"
          onClick={() => start()}
          loading={isPending}
        >
          测试
        </Button>
      }
      itemLayout="horizontal"
      dataSource={data}
      loading={isLoading}
      renderItem={item => <TaskProgress key={clsx([item.label, item.createdAt, item.value.toFixed()])} {...item} />}
    />
  )
}

function TaskProgress({ label, value, createdAt }: any) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(value !== 1)
  const { data } = useQuery({
    queryKey: ['task', label],
    queryFn: async () => {
      const res = await client.api.task[':id'].$get({
        param: {
          id: label,
        },
      })
      return res.json()
    },
    refetchInterval: 5000,
    enabled,
    initialData: value,
  })

  useEffect(() => {
    if (value !== 1 && data === 1) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['data', today] })
      setEnabled(false)
    }
  }, [data, queryClient, value])

  const renderContent = useCallback(() => {
    const current = dayjs(createdAt)
    {
      if (data === 0) {
        return <span className="text-xs">等待中</span>
      }
      if (data === 1) {
        return (
          <span className="text-xs text-green-600">
            已完结 ({current.isToday() ? current.format('HH:mm') : current.fromNow()})
          </span>
        )
      }

      return <span className="text-xs text-blue-500">执行中</span>
    }
  }, [createdAt, data])
  return (
    <List.Item>
      <List.Item.Meta title={label} description={renderContent()} />
      <div className="w-40">
        <Progress showInfo={false} percent={data * 100} />
      </div>
    </List.Item>
  )
}
