// Adjust the template's app.json for this app (name, ids, web build). Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app.json', import.meta.url);
const json = JSON.parse(readFileSync(path, 'utf8'));
const expo = (json.expo ??= {});

expo.name = 'Việc chung';
expo.slug = 'viec-chung';
expo.scheme = 'viecchung';
expo.userInterfaceStyle = 'light';
expo.ios = { ...expo.ios, bundleIdentifier: 'com.hoacangio.viecchung' };
expo.android = { ...expo.android, package: 'com.hoacangio.viecchung' };
expo.web = {
  ...expo.web,
  bundler: 'metro',
  output: 'single',
  name: 'Việc chung',
  shortName: 'Việc chung',
  themeColor: '#1D4ED8',
  backgroundColor: '#FBFAF8',
};

writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
console.log('app.json patched');
