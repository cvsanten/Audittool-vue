#!/usr/bin/env bash
# One-time bootstrap on the staging EC2 (run as deploy user, e.g. ubuntu).
set -euo pipefail

APP_DIR="${1:-$HOME/Audittool-vue}"
REPO="${2:-https://github.com/cvsanten/Audittool-vue.git}"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin
git checkout main
git pull --ff-only origin main

docker compose build
docker compose up -d

echo ""
echo "Vue container listening on 127.0.0.1:3001"
echo "Host reverse proxy (nginx on staging EC2):"
echo "  sudo cp deploy/nginx-staging.conf /etc/nginx/sites-available/vue-staging.christavansanten.org"
echo "  sudo ln -sf /etc/nginx/sites-available/vue-staging.christavansanten.org /etc/nginx/sites-enabled/"
echo "  sudo certbot --nginx -d vue-staging.christavansanten.org"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "DNS: vue-staging.christavansanten.org -> this host"
