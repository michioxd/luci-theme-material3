#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-root@192.168.56.2}"
THEME="${THEME:-material3}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bun watch:css &

sync_theme() {
  echo "==> Prepare dirs"
  ssh "$HOST" "
    mkdir -p /www/luci-static/$THEME
    mkdir -p /www/luci-static/resources
    mkdir -p /usr/share/ucode/luci/template/themes/$THEME
  "

  echo "==> Sync static"
  rsync -az --delete \
    "$ROOT_DIR/htdocs/luci-static/$THEME/" \
    "$HOST:/www/luci-static/$THEME/"

  echo "==> Sync LuCI resources"
  rsync -az \
    "$ROOT_DIR/htdocs/luci-static/resources/" \
    "$HOST:/www/luci-static/resources/"

  echo "==> Sync ucode templates"
  rsync -az --delete \
    "$ROOT_DIR/ucode/template/themes/$THEME/" \
    "$HOST:/usr/share/ucode/luci/template/themes/$THEME/"

  echo "==> Select theme + clear cache"
  ssh "$HOST" "
    uci set luci.main.theme='$THEME'
    uci set luci.main.mediaurlbase='/luci-static/$THEME'
    uci commit luci
    rm -rf /tmp/luci-* /tmp/luci-indexcache.*
  "

  echo "==> Done"
}

sync_theme

echo "==> Watching..."
while inotifywait -qr \
  -e modify,create,delete,move \
  "$ROOT_DIR/htdocs" "$ROOT_DIR/ucode"
do
  sync_theme
done