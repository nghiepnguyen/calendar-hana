// Phase 3B.4.3 audit tooling: reproducible ERFA 2.0.1 coefficient extraction.
//
// Reads the pinned upstream release tarball, verifies its SHA-256, extracts the
// coefficient tables from src/epv00.c and src/nut00b.c, and emits generated
// TypeScript data modules for shared/astronomy/erfa/. Numeric literals are
// copied token-for-token from upstream C; prettier then normalises their
// spelling (never their value). Every emitted value is re-parsed and compared
// with the upstream token parsed independently, so no coefficient can exist
// without a traceable upstream source token.
//
// Usage:
//   node tasks/calendar-audit/erfa-foundation-v3.3/extract-erfa.mjs [--check]
// Environment:
//   ERFA_TARBALL  path to erfa-2.0.1.tar.gz (default /tmp/zero342a-erfa.tgz)
// --check regenerates into memory and fails if committed files differ.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as prettier from 'prettier'

const ARCHIVE_SHA256 = 'd5469fbd0b212b3c7270c1da15c9bd82f37da9218fc89627f98283d27b416cbf'
const ARCHIVE_URL = 'https://github.com/liberfa/erfa/releases/download/v2.0.1/erfa-2.0.1.tar.gz'
const tarball = process.env.ERFA_TARBALL ?? '/tmp/zero342a-erfa.tgz'
const check = process.argv.includes('--check')
const outDir = 'shared/astronomy/erfa'
const auditDir = 'tasks/calendar-audit/erfa-foundation-v3.3'
const sha = (b) => createHash('sha256').update(b).digest('hex')

const archive = readFileSync(tarball)
if (sha(archive) !== ARCHIVE_SHA256) throw new Error(`ERFA archive hash mismatch: ${sha(archive)}`)
const work = mkdtempSync(join(tmpdir(), 'erfa-extract-'))
const members = [
  'epv00.c', 'nut00b.c', 'pfw06.c', 'obl06.c', 'fw2m.c', 'ab.c', 'pn.c', 'pm.c', 'pdp.c',
  'sxp.c', 'rx.c', 'rz.c', 'rxp.c', 'ir.c', 'erfam.h', 'erfa.h', 't_erfa_c.c',
].map((f) => `erfa-2.0.1/src/${f}`)
execFileSync('tar', ['-xzf', tarball, '-C', work, ...members, 'erfa-2.0.1/LICENSE'])
const sources = Object.fromEntries(
  members.map((m) => [m.split('/').at(-1), readFileSync(join(work, m), 'utf8')]),
)
const src = (f) => sources[f]
const license = readFileSync(join(work, 'erfa-2.0.1/LICENSE'))
const sourceHashes = Object.fromEntries(
  members.map((m) => [m.replace('erfa-2.0.1/', ''), sha(readFileSync(join(work, m)))]),
)
rmSync(work, { recursive: true, force: true })

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ')
const tokens = (body) =>
  stripComments(body)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
const literal = /^-?(\d+\.\d*|\d*\.\d+|\d+)([eE][-+]?\d+)?$/

// ---- EPV00 -----------------------------------------------------------------
const epvSource = src('epv00.c')
const arrays = {}
for (const [, name, body] of epvSource.matchAll(
  /static const double ([es][012][xyz])\[\] = \{([\s\S]*?)\};/g,
)) {
  const toks = tokens(body)
  for (const t of toks) if (!literal.test(t)) throw new Error(`Unexpected token ${t} in ${name}`)
  if (toks.length % 3) throw new Error(`${name} is not a triplet table`)
  arrays[name] = toks
}
const order = ['e0', 'e1', 'e2', 's0', 's1', 's2'].flatMap((p) => ['x', 'y', 'z'].map((a) => p + a))
if (Object.keys(arrays).sort().join() !== [...order].sort().join())
  throw new Error('EPV00 table set mismatch')
const rotation = {}
for (const [, name, value] of epvSource.matchAll(/(am\d\d) = +(-?[\d.]+)[,;]/g)) rotation[name] = value
if (Object.keys(rotation).length !== 7) throw new Error('EPV00 rotation constants missing')

// ---- NUT00B ----------------------------------------------------------------
const nutSource = stripComments(src('nut00b.c'))
const nutBody = nutSource.split('} x[] = {')[1].split('};')[0]
const nutRows = [...nutBody.matchAll(/\{([^{}]+)\}/g)].map((m) => tokens(m[1]))
for (const r of nutRows) {
  if (r.length !== 11) throw new Error('NUT00B row width')
  for (const t of r) if (!literal.test(t)) throw new Error(`Unexpected nutation token ${t}`)
}
const fixed = {
  DPPLAN: /DPPLAN = (-?[\d.]+) \* ERFA_DMAS2R/.exec(nutSource)?.[1],
  DEPLAN: /DEPLAN = +(-?[\d.]+) \* ERFA_DMAS2R/.exec(nutSource)?.[1],
}
if (!fixed.DPPLAN || !fixed.DEPLAN) throw new Error('NUT00B planetary offsets missing')

// ---- erfam.h constants -------------------------------------------------------
const header = src('erfam.h')
const constant = (name) => {
  const m = new RegExp(`#define ${name} \\(?([-\\d.e]+)\\)?`).exec(header)
  if (!m) throw new Error(`Missing ${name}`)
  return m[1]
}
const constants = Object.fromEntries(
  ['ERFA_DAS2R', 'ERFA_D2PI', 'ERFA_DPI', 'ERFA_TURNAS', 'ERFA_DJY', 'ERFA_DJC', 'ERFA_DJ00',
    'ERFA_DAYSEC', 'ERFA_DAU', 'ERFA_CMPS', 'ERFA_SRS', 'ERFA_DR2D'].map((n) => [n, constant(n)]),
)

// ---- Emit --------------------------------------------------------------------
const shortest = (token) => {
  const value = Number(token)
  const text = String(value)
  if (!Object.is(Number(text), value)) throw new Error(`round-trip failure ${token}`)
  return /[.e]/.test(text) ? text : `${text}.0`
}
const banner = (file) => `// GENERATED FILE — DO NOT EDIT. Regenerate with:
//   node tasks/calendar-audit/erfa-foundation-v3.3/extract-erfa.mjs
// Source: ERFA 2.0.1 src/${file} (sha256 ${sourceHashes['src/' + file]}),
// release archive sha256 ${ARCHIVE_SHA256}.
// Copyright (C) 2013-2023, NumFOCUS Foundation. All rights reserved.
// Derived, with permission, from the IAU SOFA library. This is a modified
// (transcribed) derivative of ERFA, not SOFA itself; see ./LICENSE-ERFA.txt for
// the redistribution conditions, disclaimer and no-endorsement clause.
`
const epvTs =
  banner('epv00.c') +
  `
/** EPV00 harmonic tables. Each table is a flat list of [amplitude (au),
 * phase (rad), frequency (rad per Julian year)] triplets, in upstream order.
 * e* = Sun-to-Earth vector, s* = SSB-to-Sun vector; 0/1/2 = power of T. */
${order.map((n) => `export const ${n.toUpperCase()}: readonly number[] = [${arrays[n].join(', ')}]`).join('\n')}

/** Ecliptic-to-BCRS orientation matrix elements (empirical fit to DE405). */
export const EPV00_ROTATION = {
${Object.entries(rotation).map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const

/** Term counts per table, upstream order x, y, z. Total 1,951. */
export const EPV00_TERM_COUNTS = {
${order.map((n) => `  ${n}: ${arrays[n].length / 3},`).join('\n')}
} as const
`
const nutTs =
  banner('nut00b.c') +
  `
/** IAU 2000B luni-solar nutation series, 77 rows in upstream order:
 * [nl, nlp, nf, nd, nom, ps, pst, pc, ec, ect, es]; amplitudes in 0.1 µas. */
export const NUT00B_TERMS: readonly (readonly number[])[] = [
${nutRows.map((r) => `  [${r.join(', ')}],`).join('\n')}
]

/** Fixed offsets in lieu of planetary nutation, milliarcseconds. */
export const NUT00B_DPPLAN_MAS = ${fixed.DPPLAN}
export const NUT00B_DEPLAN_MAS = ${fixed.DEPLAN}
`
const constTs =
  banner('erfam.h') +
  `
/** Constants from erfam.h. Upstream literals carry more digits than a double holds;
 * they are emitted as the shortest round-trip decimal of the identical double. */
${Object.entries(constants).map(([k, v]) => `export const ${k} = ${shortest(v)} // erfam.h: ${v}`).join('\n')}
`
const options = { ...(await prettier.resolveConfig('shared/x.ts')), parser: 'typescript' }
const outputs = {
  [`${outDir}/epv00.data.ts`]: await prettier.format(epvTs, options),
  [`${outDir}/nut00b.data.ts`]: await prettier.format(nutTs, options),
  [`${outDir}/constants.data.ts`]: await prettier.format(constTs, options),
  [`${outDir}/LICENSE-ERFA.txt`]: license,
}

// Value-level verification: each emitted literal must equal its upstream token.
const emittedNumbers = (ts) =>
  stripComments(ts.replace(/\/\/.*$/gm, ''))
    .match(/(?<![\w.])-?(\d+\.\d*|\d*\.\d+|\d+)([eE][-+]?\d+)?(?![\w.])/g)
    .map(Number)
const upstreamEpv = order.flatMap((n) => arrays[n]).map(Number)
const epvEmitted = emittedNumbers(outputs[`${outDir}/epv00.data.ts`].split('export const EPV00_ROTATION')[0])
if (epvEmitted.length !== upstreamEpv.length || epvEmitted.some((v, i) => !Object.is(v, upstreamEpv[i])))
  throw new Error('EPV00 emitted values differ from upstream tokens')
const nutBlock = outputs[`${outDir}/nut00b.data.ts`].split('NUT00B_TERMS')[1].split('export const')[0]
const nutEmitted = emittedNumbers(nutBlock.slice(nutBlock.indexOf('=')))
const upstreamNut = nutRows.flat().map(Number)
if (nutEmitted.length !== upstreamNut.length || nutEmitted.some((v, i) => !Object.is(v, upstreamNut[i])))
  throw new Error('NUT00B emitted values differ from upstream tokens')

const counts = Object.fromEntries(order.map((n) => [n, arrays[n].length / 3]))
const totalTerms = Object.values(counts).reduce((a, b) => a + b, 0)
if (totalTerms !== 1951) throw new Error(`EPV00 term total ${totalTerms} !== 1951`)
if (nutRows.length !== 77) throw new Error('NUT00B must have 77 rows')

const outputHashes = Object.fromEntries(Object.entries(outputs).map(([p, b]) => [p, sha(b)]))
if (check) {
  const drift = Object.entries(outputs).filter(([p, b]) => sha(readFileSync(p)) !== sha(b))
  if (drift.length) throw new Error(`Generated files drifted: ${drift.map(([p]) => p).join(', ')}`)
  console.log('extract-erfa --check: generated files reproduce byte-for-byte')
} else {
  for (const [p, b] of Object.entries(outputs)) writeFileSync(p, b)
  writeFileSync(
    `${auditDir}/extraction-manifest.json`,
    JSON.stringify(
      {
        generator: `${auditDir}/extract-erfa.mjs`,
        archive: { url: ARCHIVE_URL, sha256: ARCHIVE_SHA256, bytes: archive.length },
        sourceHashes,
        licenseSha256: sha(license),
        epv00: { termCounts: counts, totalTerms, scalarCoefficients: totalTerms * 3, rotationConstants: rotation },
        nut00b: { rows: nutRows.length, scalarCoefficients: nutRows.length * 11, fixedOffsetsMas: fixed },
        constants,
        transformations: [
          'C comments stripped; numeric tokens copied verbatim in upstream order',
          'prettier (repository config) normalises literal spelling, e.g. e+00 -> e00; values re-verified with Object.is',
          'C struct rows of nut00b emitted as 11-element numeric arrays (5 integer multipliers + 6 doubles)',
          'erfam.h constants emitted as the shortest round-trip decimal of the same double (upstream text kept in a trailing comment)',
        ],
        outputHashes,
      },
      null,
      2,
    ) + '\n',
  )
  console.log({ totalTerms, nutRows: nutRows.length, outputHashes })
}
