import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BirthInfoForm } from './BirthInfoForm'
import { RepositoryContext } from '../../data/repositoryContext'
import { LocalRepository } from '../../data/localRepository'
import { CalendarDatabase } from '../../data/db'
import { createDefaultSettings } from '../../data/defaultCategories'

it('focuses the date field when opened from the personal profile link', async () => {
  const repository = new LocalRepository(new CalendarDatabase('birth-anchor'))
  try {
    render(
      <RepositoryContext.Provider value={repository}>
        <BirthInfoForm settings={createDefaultSettings('')} signedIn={false} focusBirth />
      </RepositoryContext.Provider>,
    )
    expect(screen.getByLabelText('Ngày sinh')).toHaveFocus()
  } finally {
    await repository.db.delete()
  }
})
