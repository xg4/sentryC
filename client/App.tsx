import { Divider, Select } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import HostTable from './components/HostTable'
import TaskList from './components/TaskList'
import TopList from './components/TopList'
import { today } from './constants'

const now = dayjs()
const options = [
  {
    label: '昨天',
    value: [now.subtract(1, 'd').startOf('d').toISOString(), now.subtract(1, 'd').endOf('d').toISOString()].join('|'),
  },
  {
    label: '最近7天',
    value: [now.subtract(7, 'd').startOf('d').toISOString(), now.endOf('d').toISOString()].join('|'),
  },
  {
    label: '最近30天',
    value: [now.subtract(30, 'd').startOf('d').toISOString(), now.endOf('d').toISOString()].join('|'),
  },
]
export default function App() {
  const [selected, setSelected] = useState<string>(options[0].value)

  return (
    <div className="container mx-auto px-2.5 py-10">
      <div className="flex max-h-96 divide-x bg-white p-2.5 shadow-md">
        <TopList className="flex-1 overflow-auto px-8" title={<h3>今日最佳 TOP 10</h3>} dateRange={today} />
        <TopList
          className="flex-1 overflow-auto px-8"
          title={
            <div className="flex justify-between">
              <Select value={selected} onChange={setSelected} size="small" className="w-28" options={options}></Select>
              <h3>最佳 TOP 10</h3>
            </div>
          }
          dateRange={selected.split('|')}
        />
        <TaskList className="flex-1 overflow-auto px-8" />
      </div>
      <Divider />
      <HostTable className="bg-white p-2.5 shadow-md" />
    </div>
  )
}
