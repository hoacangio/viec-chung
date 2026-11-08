// Runs the pure-logic tests in the Vietnam time zone (parsing depends on local time).
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('src/lib').filter((f) => f.endsWith('.test.ts')).map((f) => `src/lib/${f}`);
const r = spawnSync('npx', ['tsx', '--test', ...files], {
  stdio: 'inherit',
  env: { ...process.env, TZ: 'Asia/Ho_Chi_Minh' },
  shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
