#!/usr/bin/env bash
# Luxion macOS paketi üretir: macos/cikti/Luxion-macOS-<sürüm>.zip (ve Mac'te çalıştırılırsa .dmg)
#
#   bash macos/paketle.sh
#
# Paketin içinde: Luxion.app (arayüz derlenmiş, sunucu düz JavaScript'e çevrilmiş, Apple Silicon ve Intel için
# Node.js gömülü). Kullanıcının bilgisayarında Node.js, npm ya da internetten paket indirme gerekmez.
set -euo pipefail

KOK="$(cd "$(dirname "$0")/.." && pwd)"
SURUM="${LUXION_SURUM:-1.0.0}"
NODE_SURUM="${NODE_SURUM:-v24.22.3}"   # LTS
CIKTI="$KOK/macos/cikti"
ONBELLEK="$KOK/macos/.onbellek"
APP="$CIKTI/Luxion.app"
RES="$APP/Contents/Resources"

echo "▸ Luxion $SURUM paketleniyor (Node $NODE_SURUM)"

# 1) Bağımlılıklar ve derleme
[ -d "$KOK/server/node_modules" ] || npm --prefix "$KOK/server" install --no-audit --no-fund
[ -d "$KOK/web/node_modules" ] || npm --prefix "$KOK/web" install --no-audit --no-fund
npm --prefix "$KOK/web" run build
node "$KOK/scripts/build-server.mjs"

# 2) Uygulama iskeleti
rm -rf "$CIKTI"
mkdir -p "$APP/Contents/MacOS" "$RES/app/server" "$RES/app/web" "$RES/node"
sed "s/__SURUM__/$SURUM/g" "$KOK/macos/Info.plist" > "$APP/Contents/Info.plist"
printf 'APPL????' > "$APP/Contents/PkgInfo"
cp "$KOK/macos/Luxion" "$APP/Contents/MacOS/Luxion"
chmod 755 "$APP/Contents/MacOS/Luxion"
cp "$KOK/macos/Luxion.icns" "$RES/Luxion.icns"

# 3) Uygulama dosyaları
cp -R "$KOK/server/build" "$KOK/server/config" "$KOK/server/prompts" "$KOK/server/package.json" "$KOK/server/package-lock.json" "$RES/app/server/"
cp "$KOK/server/.env.example" "$RES/app/server/.env.example"
cp -R "$KOK/web/dist" "$RES/app/web/dist"
mkdir -p "$RES/app/scenes" && cp -R "$KOK/scenes/noxion" "$RES/app/scenes/noxion"
rm -rf "$RES/app/scenes/noxion/audio"
echo "$SURUM-$(date +%Y%m%d%H%M%S)" > "$RES/app/SURUM"
# Yalnızca çalışma zamanı bağımlılıkları (hepsi saf JavaScript: işletim sisteminden bağımsız)
npm --prefix "$RES/app/server" ci --omit=dev --no-audit --no-fund --ignore-scripts >/dev/null
rm -f "$RES/app/server/package-lock.json"
if find "$RES/app/server/node_modules" -name '*.node' | grep -q .; then
  echo "HATA: çalışma zamanı bağımlılıklarında yerel (.node) modül var; macOS'ta derlenmesi gerekir." >&2
  exit 1
fi

# 4) Node.js (Apple Silicon + Intel), SHA-256 doğrulamalı
mkdir -p "$ONBELLEK"
SHASUMS="$ONBELLEK/SHASUMS256-$NODE_SURUM.txt"
[ -s "$SHASUMS" ] || curl -fsSL "https://nodejs.org/dist/$NODE_SURUM/SHASUMS256.txt" -o "$SHASUMS"
for MIMARI in darwin-arm64 darwin-x64; do
  AD="node-$NODE_SURUM-$MIMARI.tar.gz"
  [ -s "$ONBELLEK/$AD" ] || curl -fSL --progress-bar "https://nodejs.org/dist/$NODE_SURUM/$AD" -o "$ONBELLEK/$AD"
  BEKLENEN="$(grep " $AD\$" "$SHASUMS" | cut -d' ' -f1)"
  if command -v sha256sum >/dev/null; then GERCEK="$(sha256sum "$ONBELLEK/$AD" | cut -d' ' -f1)"; else GERCEK="$(shasum -a 256 "$ONBELLEK/$AD" | cut -d' ' -f1)"; fi
  [ -n "$BEKLENEN" ] && [ "$BEKLENEN" = "$GERCEK" ] || { echo "HATA: $AD SHA-256 tutmuyor" >&2; exit 1; }
  mkdir -p "$RES/node/$MIMARI/bin"
  tar -xzf "$ONBELLEK/$AD" -C "$RES/node/$MIMARI/bin" --strip-components=2 "node-$NODE_SURUM-$MIMARI/bin/node"
  tar -xzf "$ONBELLEK/$AD" -C "$RES/node/$MIMARI" --strip-components=1 "node-$NODE_SURUM-$MIMARI/LICENSE"
  chmod 755 "$RES/node/$MIMARI/bin/node"
done

# 5) Kurulum rehberi ve arşiv
cp "$KOK/macos/KURULUM.txt" "$CIKTI/Kurulum Rehberi.txt"
cd "$CIKTI"
ZIP="Luxion-macOS-$SURUM.zip"
rm -f "$ZIP"
zip -qry -9 "$ZIP" "Luxion.app" "Kurulum Rehberi.txt"
echo "✓ $CIKTI/$ZIP ($(du -h "$ZIP" | cut -f1))"

# 6) Mac'te çalışıyorsa ayrıca .dmg (sürükle-bırak kurulum penceresi)
if command -v hdiutil >/dev/null; then
  DMG_KOK="$CIKTI/dmg"
  rm -rf "$DMG_KOK" && mkdir -p "$DMG_KOK"
  ditto "Luxion.app" "$DMG_KOK/Luxion.app"
  cp "Kurulum Rehberi.txt" "$DMG_KOK/"
  ln -s /Applications "$DMG_KOK/Applications"
  # İmzasız uygulama: Apple Silicon'da yerel (ad-hoc) imza şart
  codesign --force --deep --sign - "$DMG_KOK/Luxion.app" 2>/dev/null || true
  hdiutil create -volname "Luxion" -srcfolder "$DMG_KOK" -ov -format UDZO "Luxion-macOS-$SURUM.dmg" >/dev/null
  rm -rf "$DMG_KOK"
  echo "✓ $CIKTI/Luxion-macOS-$SURUM.dmg"
fi
