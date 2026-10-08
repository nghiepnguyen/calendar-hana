#!/bin/sh
# Phase 3B.4.4A — reproduce the astronomy authority + Golden vNext evidence.
# Run from the repository root:  WORK=<scratch> sh tasks/calendar-audit/astronomy-authority-v3.4A/reproduce.sh
# Never modifies production code, golden-v3, or the frozen golden-v4 bytes: the
# regenerated, re-reviewed candidates are compared byte-for-byte with golden-v4.
#
# Pinned inputs (verified below):
#   DE440S        JPL de440s.bsp          c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2
#   SKYFIELD_PATH PYTHONPATH providing skyfield 1.55 + jplephem 2.24 + numpy
set -eu
: "${WORK:?set WORK to a scratch directory}" "${DE440S:=/tmp/authority-342-de440s.bsp}" "${SKYFIELD_PATH:=/tmp/authority-342-python}"
export DE440S SKYFIELD_PATH
A=tasks/calendar-audit/astronomy-authority-v3.4A
LEAP=tasks/calendar-audit/erfa-foundation-v3.3/clock/iers-Leap_Second.dat
C="$WORK/candidate"

echo "0. pinned inputs"
echo "c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2  $DE440S" | shasum -a 256 -c -
echo "6cb6f5d4b819f2e568e25db4b0b26d89dedf031fdffb18bc94d40f4e94e268d7  $LEAP" | shasum -a 256 -c -
PYTHONPATH="$SKYFIELD_PATH" python3 -c "import skyfield, jplephem; assert skyfield.__version__ == '1.55' and jplephem.__version__ == '2.24'"

echo "1. generate candidates (JPL authority, then Group B vNext) and format"
rm -rf "$C" && mkdir -p "$C"
PYTHONPATH="$SKYFIELD_PATH:$A/generator" python3 $A/generator/jpl_authority.py "$DE440S" $LEAP "$C/authority.json"
python3 $A/generator/groupb_generator.py "$C/authority.json" calendar-rule-extraction-v3.json "$C/group-b" > /dev/null
npx prettier --write "$C/authority.json" "$C"/group-b/*.json > /dev/null

echo "2. independent reviews"
PYTHONPATH="$SKYFIELD_PATH" python3 $A/review/review_authority.py "$DE440S" "$C/authority.json" "$C/review-authority.json" > /dev/null
node $A/review/review_groupb.mjs "$C/group-b" "$C/authority.json" "$C/review-authority.json" $LEAP "$C/review-groupb.json"

echo "3. byte identity with the frozen golden-v4 (no regeneration in place)"
node $A/freeze.mjs "$C" "$C/review-authority.json" "$C/review-groupb.json" --verify-only

echo "4. Golden tooling mutations G1-G12"
WORK="$WORK/mutants" node $A/mutation/mutate-golden.mjs

echo "5. validation and projections (ERFA vs authority, old/new diff, Group A, Bazi)"
node $A/analysis/analyze.mjs > /dev/null

echo "6. frozen golden-v4 tests"
npx vitest run --config $A/tests/vitest.golden.config.ts
echo done
