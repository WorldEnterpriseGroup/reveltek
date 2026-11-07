#!/usr/bin/env bash
# Regression gate: fail when HEAD has a missing local reference that BASE did not.
# The site has long-standing broken refs (theme leftovers); this blocks new ones
# without demanding the old ones are fixed first.
# Usage: scripts/check-new-missing-refs.sh <base-commit>
set -euo pipefail
base=${1:?usage: check-new-missing-refs.sh <base-commit>}
here=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'git worktree remove --force "$work/base" >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

git cat-file -e "$base^{commit}" || { echo "ERROR: base commit $base is not available" >&2; exit 2; }
git worktree add -q --detach "$work/base" "$base"

# The checker exits 1 when anything is missing; here only the listing matters.
node "$here/check-local-refs.mjs" . | grep -v '^check-local-refs:' | LC_ALL=C sort -u >"$work/head.txt" || true
node "$here/check-local-refs.mjs" "$work/base" | grep -v '^check-local-refs:' | LC_ALL=C sort -u >"$work/base.txt" || true

new=$(LC_ALL=C comm -23 "$work/head.txt" "$work/base.txt")
fixed=$(LC_ALL=C comm -13 "$work/head.txt" "$work/base.txt" | grep -c . || true)
echo "missing local refs: base $(grep -c . "$work/base.txt" || true), head $(grep -c . "$work/head.txt" || true), fixed $fixed"
if [ -n "$new" ]; then
  echo "ERROR: new missing local references:" >&2
  echo "$new" >&2
  exit 1
fi
echo "OK: no new missing local references"
