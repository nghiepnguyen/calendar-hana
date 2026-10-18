import { readFileSync, writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import fixture from './audit-fixtures/mansion-decision-baseline-v1.json'
import { getAlmanac } from './almanac'
import { P4_DORMANT_GODS } from './p4ScoreAdapter'

// Roadmap 9b: catalog gods present per P4 date as the engine passes them to scoring (flag OFF, the
// production manifest), frozen before the 9b adapter code as an input of p4-score-golden-v2 (role
// frozen_engine_presence_input, PRD 9b §4/§6.4). Dormant gods are left out: Golden v2 presence owns them.
// P4_SCORE_GOLDEN_V2_PRESENCE_WRITE=1 rewrites the file.
const FILE = 'docs/audits/sources/p4-vol10/p4-score-golden-v2/presence-input.tsv'

it('9b Golden presence input equals the engine (flag OFF)', () => {
  const out = ['date\tofficer\tgood\tbad']
  for (const { date } of fixture.days) {
    const a = getAlmanac(date as never)
    const ids = (source: string) =>
      [
        ...new Set(
          a.activityRecommendations.flatMap((r) =>
            r.contributions
              .filter((c) => c.source === source && !P4_DORMANT_GODS.has(c.ruleId))
              .map((c) => c.ruleId),
          ),
        ),
      ].sort()
    const officer = a.activityRecommendations[0]!.contributions.find((c) => c.source === 'truc')!
    out.push(
      [
        date,
        officer.ruleId.split(':')[0],
        ids('good_god').join(' '),
        ids('bad_god').join(' '),
      ].join('\t'),
    )
  }
  const text = out.join('\n') + '\n'
  if (process.env.P4_SCORE_GOLDEN_V2_PRESENCE_WRITE === '1') writeFileSync(FILE, text)
  expect(text).toBe(readFileSync(FILE, 'utf8'))
}, 300_000)
