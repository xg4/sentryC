import { Table, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { isNumber } from 'lodash-es'
import { today } from '../constants'
import useRecord from '../hooks/useRecord'
import { RecordResult } from '../types'

function diff(a: number, b: number) {
  return a - b
}

function render(v?: number) {
  return isNumber(v) ? v.toFixed(1) : v
}

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
      render,
      defaultSortOrder: 'ascend',
      sorter: {
        compare: (a, b) => diff(a.average, b.average),
        multiple: 2,
      },
    },
    {
      title: '标准差 σ',
      dataIndex: 'std',
      render,
      defaultSortOrder: 'ascend',
      sorter: {
        compare: (a, b) => diff(a.std, b.std),
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
        compare: (a, b) => diff(a.packetLossRate, b.packetLossRate),
        multiple: 3,
      },
    },
    {
      title: '最小延迟',
      dataIndex: 'minValue',
      render,
      sorter: {
        compare: (a, b) => diff(a.minValue, b.minValue),
        multiple: 1,
      },
    },
    {
      title: '最大延迟',
      dataIndex: 'maxValue',
      render,
      sorter: {
        compare: (a, b) => diff(a.maxValue, b.maxValue),
        multiple: 1,
      },
    },
    {
      title: '延迟',
      width: 300,
      dataIndex: 'values',
      render(value: number[]) {
        return value.map(i => i.toFixed(1)).join(', ')
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
