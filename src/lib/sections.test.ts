import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSections } from './sections';
import type { Item } from '../types';

const NOW = new Date(2026, 10, 8, 14, 0);
const iso = (day: number, h: number) => new Date(2026, 10, day, h).toISOString();
let n = 0;
const item = (p: Partial<Item>): Item => ({
  id: `i${++n}`,
  household_id: 'h',
  kind: 'task',
  title: `t${n}`,
  assignee_id: null,
  due_at: null,
  done: false,
  done_by: null,
  done_at: null,
  created_by: 'a',
  created_at: iso(1, n),
  updated_at: iso(1, n),
  ...p,
});

const items = [
  item({ title: 'later', due_at: iso(10, 9) }),
  item({ title: 'overdue', due_at: iso(8, 10), assignee_id: 'A' }),
  item({ title: 'tonight', due_at: iso(8, 19), assignee_id: 'B' }),
  item({ title: 'soon', due_at: iso(8, 16) }),
  item({ title: 'nodate' }),
  item({ title: 'done1', done: true, done_at: iso(8, 9) }),
  item({ title: 'done2', done: true, done_at: iso(8, 11) }),
  item({ title: 'milk', kind: 'shopping' }),
  item({ title: 'eggs', kind: 'shopping', done: true, done_at: iso(8, 12) }),
];

test('tasks are bucketed and sorted', () => {
  const { sections, doneCount } = buildSections(items, 'task', 'all', true, NOW);
  assert.deepEqual(sections.map((s) => s.key), ['overdue', 'today', 'upcoming', 'nodate', 'done']);
  assert.deepEqual(sections[1].data.map((i) => i.title), ['soon', 'tonight']);
  assert.equal(sections[1].title, 'HÔM NAY · 2');
  assert.deepEqual(sections[4].data.map((i) => i.title), ['done2', 'done1']); // newest first
  assert.equal(doneCount, 2);
});

test('hiding done and filtering by assignee', () => {
  const { sections } = buildSections(items, 'task', 'B', false, NOW);
  assert.deepEqual(sections.map((s) => s.data.map((i) => i.title)), [['tonight']]);
});

test('shopping', () => {
  const { sections } = buildSections(items, 'shopping', 'all', true, NOW);
  assert.deepEqual(sections.map((s) => s.title), ['CẦN MUA · 1', 'ĐÃ MUA']);
});

test('empty', () => {
  assert.deepEqual(buildSections([], 'task', 'all', true, NOW).sections, []);
});
