import { List, Typography } from 'antd'
import { orderBy } from 'lodash-es'
import React, { useMemo } from 'react'
import useRecord from '../hooks/useRecord'

export default function TopList({
  dateRange,
  title,
  className,
}: {
  dateRange: string[]
  title: React.ReactNode
  className?: string
}) {
  const { data, isLoading } = useRecord(dateRange)

  const bestData = useMemo(() => orderBy(data ?? [], ['packetLossRate', 'average', 'std']).slice(0, 10), [data])

  return (
    <List
      header={title}
      className={className}
      loading={isLoading}
      itemLayout="horizontal"
      dataSource={bestData}
      renderItem={item => (
        <List.Item>
          <List.Item.Meta
            title={<Typography.Paragraph copyable={{ text: item.label }}>{item.label}</Typography.Paragraph>}
          />
          <ul className="text-xs text-gray-700">
            <li>延迟：{item.average}ms</li>
            <li>丢包：{(item.packetLossRate * 100).toFixed(1)}%</li>
          </ul>
        </List.Item>
      )}
    />
  )
}
