#!/bin/bash
# План 3 выкладки nikalimp.ru — вручную с Mac, когда GitHub Actions недоступен (кончились минуты, упали SSH и FTP).
# Запуск из любой папки:
#   bash ~/Desktop/NikitOS/.site/scripts/deploy-site.sh                 — собрать сайт и залить
#   bash ~/Desktop/NikitOS/.site/scripts/deploy-site.sh <папка|архив>   — залить готовую сборку (out/ или site-out.tgz)
# Ключ: ~/.ssh/nikalimp_deploy, если есть; иначе обычный ssh — спросит пароль от SSH в ISPmanager REG.RU.
set -euo pipefail
HOST="u3672757@31.31.197.26"
DIR="/var/www/u3672757/data/www/nikalimp.ru/"
KEY="$HOME/.ssh/nikalimp_deploy"
APP="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"
EXCLUDE=(--exclude '.well-known/' --exclude 'cgi-bin/' --exclude '.ftp-deploy-sync-state.json')
SSH=(ssh); [ -f "$KEY" ] && SSH=(ssh -i "$KEY")
# Одно SSH-соединение на всю выкладку: пароль спросят один раз
SOCK="$(mktemp -u /tmp/nikalimp-ssh.XXXX)"
SSH+=(-o ControlMaster=auto -o ControlPath="$SOCK" -o ControlPersist=120)

if [ -z "$SRC" ]; then
  cd "$APP"; [ -d node_modules ] || npm ci
  npm run build && node scripts/check.mjs
  SRC="$APP/out"
elif [ -f "$SRC" ]; then
  TMP="$(mktemp -d)"; tar xzf "$SRC" -C "$TMP"; SRC="$TMP/out"; [ -d "$SRC" ] || SRC="$TMP"
fi
[ -f "$SRC/index.html" ] || { echo "Нет index.html в $SRC — это не сборка сайта"; exit 1; }

echo "Заливаю $(find "$SRC" -type f | wc -l | tr -d ' ') файлов на $HOST:$DIR"
"${SSH[@]}" "$HOST" "mkdir -p '$DIR'"
rsync -az --delete --stats "${EXCLUDE[@]}" -e "${SSH[*]}" "${SRC%/}/" "$HOST:$DIR"
"${SSH[@]}" -O exit "$HOST" 2>/dev/null || true
echo "Готово: https://nikalimp.ru"
