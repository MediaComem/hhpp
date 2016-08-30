#!/usr/bin/env bash
set -e

REPO_URL="$(git remote get-url origin)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
CURRENT_COMMIT="$(git rev-parse --verify --short HEAD)"

echo



echo "Creating temporary directory..."

TMP_DIR="$(mktemp -d -t hhpp)"

function cleanup {
  echo "Cleaning up..."
  #rm -fr "$TMP_DIR"
}

trap cleanup EXIT

echo "$TMP_DIR"
echo



echo "Building site..."
echo
JEKYLL_ENV=production jekyll build -d "$TMP_DIR"
echo



echo "Fetching repository..."
echo
cd "$TMP_DIR"
git init
git remote add -t gh-pages origin "$REPO_URL"
git fetch
echo



echo "Committing & pushing changes..."
echo
cd "$TMP_DIR"
git reset --soft origin/gh-pages
git add --all .
git commit -m "Generated Jekyll site from ${CURRENT_BRANCH}@${CURRENT_COMMIT}"
git push origin master:gh-pages
echo

echo "Done!"
