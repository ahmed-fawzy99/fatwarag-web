#!/usr/bin/env bash
# Releases one image tag of the site on the server. GitHub Actions copies this file and compose.prod.yaml to
# /srv/fatwarag-web and runs it after the checks and the image build are green:
#   bash /srv/fatwarag-web/deploy.sh sha-<commit>
# Rolling back is the same command with an older tag.
set -euo pipefail

cd "$(dirname "$0")"

TAG="${1:?usage: deploy.sh <image tag>}"
export WEB_IMAGE="ghcr.io/ahmed-fawzy99/fatwarag-web:${TAG}"

exec 9>/tmp/fatwarag-web-deploy.lock
flock -w 900 9 || { echo "Another release is still running." >&2; exit 1; }

echo "==> Pulling ${WEB_IMAGE}"
docker pull --quiet "$WEB_IMAGE"

echo "==> Replacing the site"
docker compose -f compose.prod.yaml up -d --wait --remove-orphans web

echo "$TAG" > RELEASE
docker image prune -af --filter "until=168h" --filter "label=org.opencontainers.image.source=https://github.com/ahmed-fawzy99/fatwarag-web" >/dev/null

echo "==> Released ${TAG}"
