import { isEmpty } from 'lodash-es'
import { db } from '../db'
import { ipTable } from '../db/schema'
import { fetchTargetIps } from '../utils/address'

export async function getAllIps() {
  const ips = await db.select({ address: ipTable.address }).from(ipTable)
  if (isEmpty(ips)) {
    const remoteIps = await fetchTargetIps()
    console.log('remote ips: ', remoteIps.length)
    const allIps = await db
      .insert(ipTable)
      .values(
        remoteIps.map(address => ({
          address,
        })),
      )
      .returning({ address: ipTable.address })
    return allIps
  }
  return ips
}
