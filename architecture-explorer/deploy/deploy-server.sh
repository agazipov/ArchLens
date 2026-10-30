#!/usr/bin/env bash
set -euo pipefail

repo_root=/srv/archlens/repo
app_root="$repo_root/architecture-explorer"

sudo -u archlens git -C "$repo_root" fetch origin main
sudo -u archlens git -C "$repo_root" reset --hard origin/main

cd "$app_root"
sudo -u archlens npm ci --no-audit --no-fund

# The lockfile was created on Windows. Install the matching Linux native
# packages explicitly until npm reliably records cross-platform optionals.
sudo -u archlens npm install --no-save --ignore-scripts --force \
  lightningcss-linux-x64-gnu@1.32.0 \
  @tailwindcss/oxide-linux-x64-gnu@4.3.3 \
  @typescript/typescript-linux-x64@7.0.2

sudo -u archlens npm run build -- --webpack
sudo systemctl restart archlens.service
