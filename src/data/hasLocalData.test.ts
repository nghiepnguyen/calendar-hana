import { afterEach, expect, it } from 'vitest'
import { CalendarDatabase } from './db'
import { hasLocalData } from './hasLocalData'
import { LocalRepository } from './localRepository'

const repo = new LocalRepository(new CalendarDatabase(`profile-migration-${crypto.randomUUID()}`))
afterEach(async () => {
  await repo.db.delete()
})

it('thông tin ngày sinh nhập tay cũng là dữ liệu cần chuyển lên tài khoản', async () => {
  expect(await hasLocalData(repo)).toBe(false)
  await repo.saveSettings({ birthDate: '1995-05-15', birthTime: '07:30' })
  expect(await hasLocalData(repo)).toBe(true)
})
