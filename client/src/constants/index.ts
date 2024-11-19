import dayjs from 'dayjs'

export const today = [dayjs().startOf('d').toISOString(), dayjs().endOf('d').toISOString()]
