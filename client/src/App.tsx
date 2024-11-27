import { Divider, Select } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import HostTable from './components/HostTable'
import TaskList from './components/TaskList'
import TopList from './components/TopList'
import { today } from './constants'

const now = dayjs()
const options = [
  {
    label: '今天',
    value: 0,
    dateRange: today,
  },
  {
    label: '昨天',
    value: 1,
    dateRange: [now.subtract(1, 'd').startOf('d').toISOString(), now.subtract(1, 'd').endOf('d').toISOString()],
  },
  {
    label: '前天',
    value: 2,
    dateRange: [now.subtract(2, 'd').startOf('d').toISOString(), now.subtract(2, 'd').endOf('d').toISOString()],
  },
  {
    label: '汇总',
    value: 3,
    dateRange: [],
  },
]
export default function App() {
  const [selected, setSelected] = useState<number>(0)
  const selectedItem = useMemo(() => options.at(selected), [selected])
  return (
    <div className="container mx-auto px-2.5 py-10">
      <div className="flex max-h-96 divide-x bg-white p-2.5 shadow-md">
        {selectedItem ? (
          <TopList
            className="flex-1 overflow-auto px-8"
            title={
              <div className="flex justify-between">
                <Select
                  value={selected}
                  onChange={setSelected}
                  size="small"
                  className="w-28"
                  options={options}
                ></Select>
                <h3>最佳 TOP 10</h3>
              </div>
            }
            dateRange={selectedItem.dateRange}
          />
        ) : null}
        <TaskList className="flex-1 overflow-auto px-8" />
      </div>
      <Divider />
      <HostTable className="bg-white p-2.5 shadow-md" />
    </div>
  )
}
