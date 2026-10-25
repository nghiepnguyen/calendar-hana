import { describe, expect, it } from 'vitest'
import vol10 from '../almanac-data/xiejibianfangshu-vol10-yiji.json'
import { resolveVol10, splitHeadings, type Vol10Day } from './xiejiVol10Resolution'
import { evaluateEventDay } from './eventEvaluation'
import type { SolarDateString } from '../types'

const B = (c: string) => '子丑寅卯辰巳午未申酉戌亥'.indexOf(c)
const S = (c: string) => '甲乙丙丁戊己庚辛壬癸'.indexOf(c)
// Pillars below are real sexagenary days matching the officer/god of that Month Jian.
const day = (
  month: string,
  pillar: string,
  officerId: string,
  gods: string[] = [],
  unknown: string[] = [],
): Vol10Day => ({
  monthJianBranch: B(month),
  dayStem: S(pillar[0]),
  dayBranch: B(pillar[1]),
  officerId,
  presentGods: new Set(gods),
  unknownGods: new Set(unknown),
})
const verdict = (d: Vol10Day, entry: string, activityId: string) =>
  resolveVol10(d, [activityId]).find((r) => r.entry === entry)?.verdict

describe('協紀 卷十 transcription integrity', () => {
  const norm = (s: string) => s.replace(/[　\s]/g, '')
  it('splits every 用事 list completely and quotes only text present in the source lines', () => {
    for (const e of vol10.entries) {
      const lines = e.sourceLines.map(norm).join('')
      for (const text of [e.avoid, e.notAvoid, ...e.extraAvoid.map((x) => x.avoid)])
        if (text) {
          expect(() => splitHeadings(text), `${e.han}: ${text}`).not.toThrow()
          expect(lines).toContain(norm(text))
        }
      for (const c of e.clauses as { list?: string; notAvoid?: string; quote: string }[]) {
        for (const text of [c.list, c.notAvoid])
          if (text) expect(() => splitHeadings(text)).not.toThrow()
        if (c.list) expect(lines).toContain(norm(c.list))
        for (const part of c.quote.split('…').filter(Boolean))
          expect(lines, `${e.han}: ${part}`).toContain(norm(part))
      }
    }
  })
})

// Expected values reasoned by hand from the quoted sentences, not produced by the module.
describe('協紀 卷十 resolution, hand-derived cases', () => {
  it('刼煞 in 寅 month (收日, 六合): only military and medical remain taboo', () => {
    const d = day('寅', '乙亥', 'chap', ['kiep_sat'])
    expect(verdict(d, 'jie_sha', 'wedding')).toBe('not_avoided')
    expect(verdict(d, 'jie_sha', 'construction')).toBe('not_avoided')
    expect(verdict(d, 'jie_sha', 'medical')).toBe('avoid')
  })
  it('刼煞 in 巳 month depends on 月德/天德合; 辰 month without 德: cancel_both (legacy) / authority', () => {
    expect(
      verdict(day('巳', '庚寅', 'chap', ['kiep_sat', 'nguyet_duc']), 'jie_sha', 'wedding'),
    ).toBe('not_avoided')
    expect(verdict(day('巳', '甲寅', 'chap', ['kiep_sat']), 'jie_sha', 'wedding')).toBe('avoid')
    // Hand-derived before the 卷十 劫煞 faithful-v1 migration: legacy cancel_both, pinned explicitly.
    const chen = day('辰', '乙巳', 'chap', ['kiep_sat'])
    const jie = (policy: 'legacy-cancel-both' | 'faithful-v1') =>
      resolveVol10(chen, ['wedding'], { jieshaPolicy: policy }).find((r) => r.entry === 'jie_sha')
    expect(jie('legacy-cancel-both')?.verdict).toBe('no_annotation')
    expect(jie('faithful-v1')).toMatchObject({
      verdict: 'avoid',
      authority: 'xieji-vol10-jiesha-faithful-v2', // G2 Stage 2: authority v2 (cells unchanged)
    })
  })
  it('月破: 卯酉 months all taboo; elsewhere 德 spares only listed minor matters', () => {
    expect(verdict(day('卯', '乙酉', 'pha', ['nguyet_pha']), 'yue_po', 'worship')).toBe('avoid')
    const withDe = day('寅', '丙申', 'pha', ['nguyet_pha', 'nguyet_duc'])
    expect(verdict(withDe, 'yue_po', 'wedding')).toBe('avoid')
    expect(verdict(withDe, 'yue_po', 'worship')).toBe('not_listed')
    expect(verdict(day('子', '甲午', 'pha', ['nguyet_pha']), 'yue_po', 'cleaning')).toBe('avoid')
  })
  it('月建: 德 limits taboo to earthwork; unknown 天德 on a trigram month cannot be assumed absent', () => {
    expect(verdict(day('寅', '丙寅', 'kien', ['nguyet_duc']), 'yue_jian', 'wedding')).toBe(
      'not_avoided',
    )
    expect(verdict(day('寅', '丙寅', 'kien', ['nguyet_duc']), 'yue_jian', 'construction')).toBe(
      'avoid',
    )
    // 寅 month 甲寅: no 德/合, not 天赦 (戊寅), not 月恩 (丙) or 四相 (丙丁) → as usual.
    expect(verdict(day('寅', '甲寅', 'kien'), 'yue_jian', 'wedding')).toBe('avoid')
    // 卯 month 天德 is 坤 (unknown); 乙卯 carries no other listed virtue.
    expect(verdict(day('卯', '乙卯', 'kien', [], ['thien_duc']), 'yue_jian', 'wedding')).toBe(
      'undetermined',
    )
    // 子 month 甲子 is 天赦 (冬甲子): 月建 從月厭, 厭建會 with 天赦 → as usual.
    expect(verdict(day('子', '甲子', 'kien'), 'yue_jian', 'worship')).toBe('not_listed')
  })
  it('月建: 陽錯 day ignores 德; 陰陽小會 day is all taboo', () => {
    expect(verdict(day('未', '己未', 'kien', ['nguyet_duc']), 'yue_jian', 'wedding')).toBe('avoid')
    expect(verdict(day('卯', '己卯', 'kien', ['nguyet_duc']), 'yue_jian', 'worship')).toBe('avoid')
  })
  it('收日 in 寅 month follows 刼煞; 閉日 with 天德 in 子 month annotates nothing', () => {
    expect(verdict(day('寅', '乙亥', 'thu'), 'shou_ri', 'wedding')).toBe('not_avoided')
    expect(verdict(day('寅', '乙亥', 'thu'), 'shou_ri', 'medical')).toBe('avoid')
    expect(resolveVol10(day('寅', '乙亥', 'thu'), ['wedding'])[0].via).toBe('jie_sha')
    expect(verdict(day('子', '乙亥', 'be', ['thien_duc']), 'bi_ri', 'wedding')).toBe(
      'no_annotation',
    )
    expect(verdict(day('子', '乙亥', 'be', [], ['thien_duc']), 'bi_ri', 'wedding')).toBe(
      'undetermined',
    )
  })
  it('平日 in 亥 month (相日, 時德, 六合): only military and medical remain taboo', () => {
    expect(verdict(day('亥', '甲寅', 'binh'), 'ping_ri', 'wedding')).toBe('not_avoided')
    expect(verdict(day('亥', '甲寅', 'binh'), 'ping_ri', 'medical')).toBe('avoid')
  })
})

describe('event integration, diagnostics only', () => {
  it('reports 卷十 conclusions and divergence from the product score without changing it', () => {
    let items = 0
    let diverging = 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10) as SolarDateString
      const r = evaluateEventDay(date, 'wedding', { hour: 9 })
      for (const item of r.classicalResolution.items) {
        items++
        if (item.diverges) diverging++
        expect(['avoid', 'not_avoided', 'no_annotation', 'not_listed', 'undetermined']).toContain(
          item.verdict,
        )
      }
    }
    expect(items).toBeGreaterThan(0)
    expect(diverging).toBeGreaterThan(0)
  }, 60000)
})
