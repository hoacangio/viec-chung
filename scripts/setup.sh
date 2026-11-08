#!/usr/bin/env bash
# One-time project bootstrap: pulls package.json/app.json/assets from the latest
# Expo blank-typescript template, then installs the exact dependency versions that
# match that Expo SDK. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f package.json ]; then
  echo "→ Lấy khung từ template Expo mới nhất…"
  tmp="$(mktemp -d)"
  npx --yes create-expo-app@latest "$tmp/app" --template blank-typescript --no-install
  cp "$tmp/app/package.json" "$tmp/app/app.json" .
  [ -f tsconfig.json ] || cp "$tmp/app/tsconfig.json" .
  [ -d assets ] || cp -r "$tmp/app/assets" .
  rm -rf "$tmp"
  node scripts/patch-app-json.mjs
  npm pkg set name="viec-chung" main="index.ts"
  npm pkg set scripts.test="node scripts/test.mjs"
  npm pkg set scripts.typecheck="tsc --noEmit"
  npm pkg set scripts.build:web="expo export --platform web"
fi

echo "→ Cài thư viện…"
npm install
npx expo install \
  @supabase/supabase-js \
  @react-native-async-storage/async-storage \
  react-native-url-polyfill \
  react-native-safe-area-context \
  react-dom react-native-web @expo/metro-runtime \
  expo-status-bar
npm install --save-dev tsx

[ -f .env ] || cp .env.example .env
echo
echo "✓ Xong. Điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY vào .env rồi chạy:"
echo "    npx expo start --web     # chạy trên trình duyệt"
echo "    npx expo start           # quét QR bằng Expo Go"
