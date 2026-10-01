import { expect, it } from 'vitest'
import { CalendarDatabase, SETTINGS_KEY, type SettingsRow } from './db'
import { LocalRepository } from './localRepository'
import { exportData, parseImport, importData } from './exportImport'

it('defaults legacy settings and round-trips an independent disabled personal toggle', async () => {
  const repository = new LocalRepository(new CalendarDatabase('personal-settings-source'))
  const restored = new LocalRepository(new CalendarDatabase('personal-settings-restored'))
  try {
    await repository.db.settings.put({ key: SETTINGS_KEY, showAuspicious: false } as SettingsRow)
    expect((await repository.getSettings()).showPersonalFengShui).toBe(true)
    await repository.saveSettings({
      showPersonalFengShui: false,
      showAuspicious: true,
      birthDate: '1990-07-01',
    })
    const backup = await exportData(repository)
    const parsed = parseImport(JSON.stringify(backup))
    await importData(restored, parsed.file, 'replace')
    expect(await restored.getSettings()).toMatchObject({
      showPersonalFengShui: false,
      showAuspicious: true,
      birthDate: '1990-07-01',
    })
    await restored.saveSettings({ birthDate: null })
    expect((await restored.getSettings()).showPersonalFengShui).toBe(false)
  } finally {
    await repository.db.delete()
    await restored.db.delete()
  }
})
