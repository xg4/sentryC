import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, List, Progress } from 'antd'
import dayjs from 'dayjs'
import { last, orderBy } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'
import { today } from '../constants'
import { useSSE } from '../hooks/useSSE'
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
      renderItem={item => <TaskProgress key={item.label} {...item} />}
    />
  )
}

function TaskProgress({ label, createdAt, value }: { label: string; createdAt: string; value: number }) {
  const { messages } = useSSE<number>('/api/task/' + label, {
    enabled: value !== 1,
  })

  const lastValue = useMemo(() => last(messages) ?? value, [messages, value])

  const queryClient = useQueryClient()

  useEffect(() => {
    if (value !== 1 && lastValue === 1) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['records', today] })
    }
  }, [lastValue, queryClient, value])

  const renderContent = useCallback(() => {
    const time = dayjs(createdAt)
    {
      if (lastValue === 0) {
        return <span className="text-xs">等待中</span>
      }
      if (lastValue === 1) {
        return (
          <span className="text-xs text-green-600">
            已完结 ({time.isToday() ? time.format('HH:mm') : time.fromNow()})
          </span>
        )
      }

      return <span className="text-xs text-blue-500">执行中</span>
    }
  }, [createdAt, lastValue])
  return (
    <List.Item>
      <List.Item.Meta title={label} description={renderContent()} />
      <div className="w-40">
        <Progress showInfo={false} percent={lastValue * 100} />
      </div>
    </List.Item>
  )
}
