export type RecordResult = {
  label: string
  values: number[]
  packetLossRate: number
  average: number
  std: number
  createdAt: string | undefined
  minValue: number
  maxValue: number
}
