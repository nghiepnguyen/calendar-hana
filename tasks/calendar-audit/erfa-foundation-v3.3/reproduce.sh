#!/bin/sh
# Phase 3B.4.3 — regenerate every ERFA foundation evidence artefact from scratch.
# Run from the repository root. Audit tooling only; nothing here touches production code.
#
# Inputs (pinned by SHA-256, verified by the scripts):
#   ERFA_TARBALL  erfa-2.0.1.tar.gz        d5469fbd0b212b3c7270c1da15c9bd82f37da9218fc89627f98283d27b416cbf
#   DE440S        de440s.bsp (JPL)         c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2
#   SKYFIELD_PATH PYTHONPATH with skyfield 1.55, jplephem 2.24, numpy
#   WORK          scratch directory for builds and large intermediates
set -eu
: "${ERFA_TARBALL:=/tmp/zero342a-erfa.tgz}" "${DE440S:=/tmp/authority-342-de440s.bsp}"
: "${SKYFIELD_PATH:=/tmp/authority-342-python}" "${WORK:?set WORK to a scratch directory}"
export ERFA_TARBALL
D=tasks/calendar-audit/erfa-foundation-v3.3
mkdir -p "$WORK"

echo "1. coefficient extraction is byte-reproducible"
node $D/extract-erfa.mjs --check
echo "2. independent upstream ERFA C port review"
sh $D/port-review/build-upstream.sh "$WORK/erfa-build"
node $D/port-review/run-parity.mjs "$WORK/erfa-build"
echo "3. independent JPL DE440s reference + comparison"
PYTHONPATH="$SKYFIELD_PATH" python3 $D/reference/jpl-reference.py "$DE440S"
node $D/reference/compare.mjs > /dev/null
echo "4. foundation unit tests"
npx vitest run shared/astronomy/erfa
echo "5. source mutation campaign"
node $D/mutation/mutate-erfa.mjs
echo "6. migration impact projection (production unmodified; ERFA injected via vi.mock)"
export IMPACT_OUT="$WORK/impact" && mkdir -p "$IMPACT_OUT"
npx vitest run --config $D/impact/vitest.impact.config.ts $D/impact/baseline.audit.ts
npx vitest run --config $D/impact/vitest.impact.config.ts $D/impact/erfa.audit.ts
node $D/impact/compare-impact.mjs > /dev/null
echo "7. cross-runtime parity, browser gate, performance"
node $D/runtime/run-runtimes.mjs "$WORK/runtime"
node $D/runtime/webkit-offline-investigation.mjs "$WORK/runtime"
node $D/runtime/write-runtime-reports.mjs "$WORK/runtime"
echo "8. provenance manifest"
node $D/write-provenance.mjs
echo "done"
