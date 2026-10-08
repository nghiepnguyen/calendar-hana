#!/bin/sh
# Build unmodified upstream ERFA 2.0.1 and the review harness. Audit tooling only.
# Usage: sh build-upstream.sh <workdir>   (ERFA_TARBALL defaults to /tmp/zero342a-erfa.tgz)
set -eu
WORK=${1:?workdir}
TARBALL=${ERFA_TARBALL:-/tmp/zero342a-erfa.tgz}
HERE=$(cd "$(dirname "$0")" && pwd)
echo "d5469fbd0b212b3c7270c1da15c9bd82f37da9218fc89627f98283d27b416cbf  $TARBALL" | shasum -a 256 -c -
rm -rf "$WORK" && mkdir -p "$WORK" && tar -xzf "$TARBALL" -C "$WORK"
SRC="$WORK/erfa-2.0.1/src"
for mode in strict default; do
  if [ $mode = strict ]; then FLAGS="-O2 -ffp-contract=off"; else FLAGS="-O2"; fi
  mkdir -p "$WORK/$mode"
  for f in "$SRC"/*.c; do
    case "$(basename "$f")" in t_erfa_c.c) continue;; esac
    # erfaversion.c normally gets these from config.h (not used by the routines under review).
    cc $FLAGS -DPACKAGE_VERSION='"2.0.1"' -DPACKAGE_VERSION_MAJOR=2 -DPACKAGE_VERSION_MINOR=0 \
      -DPACKAGE_VERSION_MICRO=1 -DSOFA_VERSION='"20231011"' -c "$f" -I"$SRC" -o "$WORK/$mode/$(basename "$f" .c).o"
  done
  ar rcs "$WORK/$mode/liberfa.a" "$WORK/$mode"/*.o
  cc $FLAGS "$SRC/t_erfa_c.c" -I"$SRC" "$WORK/$mode/liberfa.a" -lm -o "$WORK/$mode/t_erfa_c"
  "$WORK/$mode/t_erfa_c" > "$WORK/$mode/t_erfa_c.log" 2>&1 && echo "$mode: upstream t_erfa_c PASSED: $(tail -1 "$WORK/$mode/t_erfa_c.log")"
  cc $FLAGS "$HERE/erfa-harness.c" -I"$SRC" "$WORK/$mode/liberfa.a" -lm -o "$WORK/$mode/harness"
done
cc --version | head -1
