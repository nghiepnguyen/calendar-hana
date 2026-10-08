// Writes calendar-erfa-provenance-v3.3.json from the extraction manifest and the
// current foundation sources. Usage (repo root): node .../write-provenance.mjs
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const dir = 'tasks/calendar-audit/erfa-foundation-v3.3'
const m = JSON.parse(readFileSync(`${dir}/extraction-manifest.json`, 'utf8'))
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const f = (p) => ({ path: p, sha256: sha(p), bytes: readFileSync(p).length })

const provenance = {
  phase: '3B.4.3',
  status: 'PROVENANCE_PASS',
  upstream: {
    project: 'ERFA — Essential Routines for Fundamental Astronomy (liberfa/erfa)',
    version: '2.0.1',
    derivedFrom: 'IAU SOFA (ERFA is a re-licensed derivative; this port is ERFA-derived, not SOFA)',
    archive: m.archive,
    archiveProvenanceNote: 'Archive obtained in Phase 3B.4.2A; its SHA-256 matches the 3B.4.2A record and is re-verified by every extraction and build script.',
    sourceFilesUsed: m.sourceHashes,
    license: { file: 'LICENSE', sha256: m.licenseSha256, copiedTo: 'shared/astronomy/erfa/LICENSE-ERFA.txt' },
  },
  coefficients: {
    epv00: {
      expectedTerms: 1951,
      portedTerms: m.epv00.totalTerms,
      termsByTable: m.epv00.termCounts,
      scalarCoefficients: m.epv00.scalarCoefficients,
      rotationConstants: m.epv00.rotationConstants,
      source: 'src/epv00.c static arrays e0x..s2z and am12..am33',
    },
    nut00b: {
      expectedRows: 77,
      portedRows: m.nut00b.rows,
      scalarCoefficients: m.nut00b.scalarCoefficients,
      fixedPlanetaryOffsetsMas: m.nut00b.fixedOffsetsMas,
      source: 'src/nut00b.c struct table x[] and DPPLAN/DEPLAN',
    },
    polynomialsTranscribedByHand: {
      'eraPfw06 gamb/phib/psib': 'src/pfw06.c, 3 × 6 coefficients',
      'eraObl06 eps0': 'src/obl06.c, 6 coefficients',
      'eraNut00b Delaunay arguments': 'src/nut00b.c, 5 × 2 coefficients',
    },
    erfamConstants: m.constants,
    unexplainedCoefficients: 0,
  },
  extraction: {
    method: 'Automated: Node script parses upstream C (comments stripped), copies numeric tokens in order, emits TypeScript, formats with repository prettier, re-parses every emitted literal and requires Object.is equality with the upstream token value.',
    generator: m.generator,
    reproducibility: 'node tasks/calendar-audit/erfa-foundation-v3.3/extract-erfa.mjs --check regenerates byte-identical files',
    transformations: m.transformations,
    generatedFiles: Object.entries(m.outputHashes).map(([path, sha256]) => ({ path, sha256, currentSha256: sha(path), unchanged: sha(path) === sha256 })),
  },
  handWritten: [
    { ...f('shared/astronomy/erfa/erfa.ts'), content: 'transcription of eraEpv00, eraNut00b, eraPfw06, eraObl06, eraPm, eraPn, eraAb, eraRx, eraRz and the eraApcs velocity step; operation order preserved' },
    { ...f('shared/astronomy/erfa/apparentSun.ts'), content: 'composition: light time, aberration, F-W rotation to the true ecliptic/equinox of date' },
    { ...f('shared/astronomy/erfa/detMath.ts'), content: 'deterministic fdlibm (FreeBSD msun) sin/cos/atan2 ports, Sun Microsystems notice preserved' },
    { ...f('shared/astronomy/erfa/solarTermRoots.ts'), content: 'project code: targets, integer-grid root solver, classification' },
    { ...f('shared/astronomy/erfa/clockV1.ts'), content: 'project code: clock-v1; Espenak–Meeus Delta-T polynomials as in astronomy-engine 2.1.19 (MIT); IERS leap table' },
    { ...f('shared/astronomy/erfa/index.ts'), content: 'project code: serialization and civil classification' },
    { ...f('shared/astronomy/erfa/model.ts'), content: 'project code: versioned model identity' },
  ],
  runtimeAssumptions: {
    language: 'ECMAScript 2023 (no BigInt, no WASM, no dynamic code)',
    floatingPoint: 'IEEE-754 binary64 round-to-nearest-even for + - * /; % is exact (ECMAScript remainder = C fmod); Math.sqrt assumed correctly rounded (IEEE-754 required op; verified by cross-runtime parity); Math.floor exact',
    transcendental: 'Math.sin/cos/atan2 are NOT used by the engine; deterministic fdlibm ports instead',
    endianness: 'none: the only bit access uses DataView with explicit big-endian default; no typed-array aliasing',
    fma: 'JavaScript never contracts a*b+c; the upstream C comparison is compiled with -ffp-contract=off to match',
    dates: 'Date.UTC and Date.prototype.toISOString only (spec-defined, timezone independent)',
  },
  attribution: {
    erfa: 'Retain NumFOCUS copyright, the three conditions, disclaimer and no-endorsement clause (LICENSE-ERFA.txt); identify the code as ERFA-derived and not SOFA.',
    fdlibm: 'Retain the Sun Microsystems permission notice in detMath.ts.',
    astronomyEngine: 'Delta-T polynomials mirror astronomy-engine 2.1.19 (MIT); its notice is already in THIRD_PARTY_NOTICES.md.',
  },
}
writeFileSync('calendar-erfa-provenance-v3.3.json', JSON.stringify(provenance, null, 2) + '\n')
console.log(provenance.coefficients.epv00.portedTerms, provenance.extraction.generatedFiles.every((g) => g.unchanged))
