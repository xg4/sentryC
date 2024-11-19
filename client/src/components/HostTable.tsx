import { Table, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { RecordResult } from '../../../server/types'
import { today } from '../constants'
import useRecord from '../hooks/useRecord'

export default function HostTable({ dateRange = today, className }: { dateRange?: string[]; className?: string }) {
  const { data, isLoading } = useRecord(dateRange)

  const columns: TableColumnsType<RecordResult> = [
    {
      title: '目标服务器',
      dataIndex: 'label',
      filterSearch: true,
      onFilter: (value, record) => record.label.includes(String(value)),
    },
    {
      title: '平均延迟',
      dataIndex: 'average',
      defaultSortOrder: 'ascend',
      sorter: {
        compare: (a, b) => parseFloat(a.average) - parseFloat(b.average),
        multiple: 2,
      },
    },
    {
      title: '标准差 σ',
      dataIndex: 'std',
      defaultSortOrder: 'ascend',
      sorter: {
        compare: (a, b) => parseFloat(a.std) - parseFloat(b.std),
        multiple: 1,
      },
    },
    {
      title: '丢包率',
      dataIndex: 'packetLossRate',
      render(value: number) {
        return (value * 100).toFixed(1) + '%'
      },
      defaultSortOrder: 'ascend',
      sorter: {
        compare: (a, b) => a.packetLossRate - b.packetLossRate,
        multiple: 3,
      },
    },
    {
      title: '最小延迟',
      dataIndex: 'minValue',
      sorter: {
        compare: (a, b) => a.minValue - b.minValue,
        multiple: 1,
      },
    },
    {
      title: '最大延迟',
      dataIndex: 'maxValue',
      sorter: {
        compare: (a, b) => a.maxValue - b.maxValue,
        multiple: 1,
      },
    },
    {
      title: '延迟',
      width: 300,
      dataIndex: 'values',
      render(value: number[]) {
        return value.join(', ')
      },
    },
    {
      title: '最后一次请求时间',
      dataIndex: 'createdAt',
      render(value) {
        return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
      },
    },
  ]

  return (
    <div className={className}>
      <Table rowKey="label" loading={isLoading} dataSource={data} columns={columns} />
    </div>
  )
}
