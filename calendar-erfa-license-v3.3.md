# ERFA foundation license gate v3.3

**Result: PASS** for zero-cost commercial deployment of the runtime code and data. Attribution obligations apply and are listed below. This is an engineering license review, not legal advice. No item was uncertain enough to need escalation as NEEDS_LEGAL_REVIEW.

## Runtime dependency graph

The minified foundation bundle (`shared/astronomy/erfa/index.ts`) has **no external imports**. The bundle scan finds no `eval`, `new Function`, `fetch`, XHR, `importScripts`, dynamic `import()`, DOM globals or storage. Everything it ships is listed here.

| Name | Version | License | Use | Attribution | Redistribution |
|---|---|---|---|---|---|
| ERFA routines + EPV00/IAU 2000B coefficients | 2.0.1 | ERFA license (BSD-3-Clause style; NumFOCUS) | **Runtime** (transcribed into TS) | Keep the copyright notice, the 3 conditions and the disclaimer in source and binary distributions. No endorsement by the SOFA Board or IAU. Identify as SOFA-derived, not SOFA. | Allowed, modified or unmodified, commercial included |
| fdlibm sin/cos/atan2 (FreeBSD msun) | — | Sun Microsystems permissive notice | **Runtime** (`detMath.ts`) | Keep the notice | Allowed |
| Espenak–Meeus ΔT polynomials (as in astronomy-engine 2.1.19) | 2.1.19 | MIT (astronomy-engine); the polynomials themselves are published NASA/Espenak formulae | **Runtime** (`clockV1.ts`) | MIT notice already in `THIRD_PARTY_NOTICES.md` | Allowed |
| IERS leap-second history | Bulletin C 72 | Public factual data (IERS / IANA list) | **Runtime** (28-row table) | Cite the source | Allowed |

## Audit-only tooling (never imported by application or browser code)

| Name | Version | License | Use |
|---|---|---|---|
| JPL DE440s kernel | SHA-256 `c1c7feea…49f2` | Public JPL data release | Independent reference |
| Skyfield | 1.55 | MIT | Reference observable and frame |
| jplephem | 2.24 | MIT | Kernel reader |
| NumPy | 2.4.4 | BSD-3-Clause | Reference arithmetic |
| ERFA C (compiled) | 2.0.1 | ERFA license | Port review |
| Playwright + Chromium/Firefox/WebKit | 1.63 | Apache-2.0 (browsers under their own licenses) | Runtime parity |
| rolldown | 1.2.9 | MIT | Audit bundling |
| Apple clang | 21.0.0 | Apple / Apache-2.0 with LLVM exception | Upstream build |

## Exclusions verified

- **Swiss Ephemeris:** absent from the new code, `package.json` and `package-lock.json` (0 matches). No Swiss code, data or `.se1` file is read.
- **JPL kernels:** used by the audit scripts only. No kernel is bundled, fetched or referenced by runtime code.
- **Astronomy Engine:** stays in production unchanged (MIT). The foundation does not import it. Only tests and the impact harness use it, for comparison.
- No AGPL, paid or uncleared coefficient source was introduced.

## Obligations to carry into 3B.4.4

1. Add ERFA (full `LICENSE-ERFA.txt`) and fdlibm notices to `THIRD_PARTY_NOTICES.md` when the engine first ships in a bundle.
2. Keep `shared/astronomy/erfa/LICENSE-ERFA.txt` and the per-file headers.
3. Do not describe the engine as "SOFA" or as endorsed by the IAU.
