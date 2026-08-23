#!/usr/bin/env bash
#
# verify_npm_publish.sh
#
# Polls the public npm registry until every non-private workspace package is
# retrievable at the version currently declared in its package.json.
#
# This guards the release pipeline against the propagation race where
# `npm publish --workspaces` has returned but the new versions are not yet
# served by registry.npmjs.org. Downstream consumers -- notably the Lambda
# layer build's `npm i @aws-lambda-powertools/<pkg>@<version>` inside
# `cdk synth` -- would otherwise fail with the misleading error
# `npm error code ETARGET / No matching version found`.
#
# Run from the repository root, after `npm publish --workspaces`.
# See .github/workflows/make-release.yml (publish-npm job).

set -euo pipefail

REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
# Ceiling on the propagation wait; the loop returns as soon as all versions resolve.
TIMEOUT_SECONDS="${VERIFY_TIMEOUT_SECONDS:-420}"
# Delay between polling rounds (seconds).
SLEEP_SECONDS="${VERIFY_SLEEP_SECONDS:-15}"

# Enumerate every workspace as "<name>@<version>", dropping private workspaces
# (testing-utils, layers, code-snippets, sample-app) which are never published.
mapfile -t packages < <(
  npm pkg get name version private --workspaces --json \
    | jq -r 'to_entries[]
             | select(.value.private != true)
             | "\(.value.name)@\(.value.version)"'
)

if [ "${#packages[@]}" -eq 0 ]; then
  echo "::error::verify_npm_publish: no publishable workspaces found; refusing to continue"
  exit 1
fi

echo "Waiting for ${#packages[@]} package version(s) to become available on ${REGISTRY}:"
printf '  - %s\n' "${packages[@]}"

# Returns 0 only when the version document is served (GET 200) AND its
# advertised tarball is downloadable (HEAD 200). `-f` maps any HTTP >= 400
# (404 while absent, 5xx during an incident) to a non-zero exit. `-S` is
# omitted so the expected 404s while a version propagates don't spam stderr.
is_available() {
  local pkg="$1" version="$2" body tarball
  body=$(curl -fs --max-time 30 "${REGISTRY}/${pkg}/${version}") || return 1
  tarball=$(printf '%s' "$body" | jq -r '.dist.tarball // empty')
  [ -n "$tarball" ] || return 1
  curl -fsI --max-time 30 -o /dev/null "$tarball"
}

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
pending=("${packages[@]}")

while [ "${#pending[@]}" -gt 0 ]; do
  still_pending=()
  for entry in "${pending[@]}"; do
    # Scoped names begin with '@', so split on the *last* '@' (the version
    # separator): "@aws-lambda-powertools/commons@2.35.0" -> name / version.
    pkg="${entry%@*}"
    version="${entry##*@}"
    if is_available "$pkg" "$version"; then
      echo "  available: ${entry}"
    else
      still_pending+=("$entry")
    fi
  done
  pending=("${still_pending[@]}")

  [ "${#pending[@]}" -eq 0 ] && break

  now=$(date +%s)
  if [ "$now" -ge "$deadline" ]; then
    echo "::error::verify_npm_publish: timed out after ${TIMEOUT_SECONDS}s waiting for the following package version(s) to appear on ${REGISTRY}:"
    printf '::error::  - %s\n' "${pending[@]}"
    echo "::error::These versions were accepted by 'npm publish' but are not yet served by the registry. Continuing would make the Lambda layer build's 'npm i' fail with a misleading 'npm error code ETARGET / No matching version found'. Re-run the release once propagation completes, or check for an npm registry incident at https://status.npmjs.org."
    exit 1
  fi

  echo "Still waiting on ${#pending[@]} package(s); retrying in ${SLEEP_SECONDS}s (deadline in $(( deadline - now ))s)..."
  sleep "$SLEEP_SECONDS"
done

echo "All ${#packages[@]} package version(s) are available on ${REGISTRY}."
