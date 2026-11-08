// Run: TZ=Asia/Ho_Chi_Minh npx tsx --test src/lib/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuickAdd } from './quickAdd';
import { dueLabel, bucketOf } from './format';

// Sunday 8 Nov 2026, 14:00 local
const NOW = new Date(2026, 10, 8, 14, 0);
const d = (day: number, h: number, m = 0, month = 10, year = 2026) => new Date(year, month, day, h, m);

const cases: Array<[string, string, Date | null, string | null]> = [
  ['mai 8h đóng tiền điện', 'Đóng tiền điện', d(9, 8), null],
  ['Mai 8h đóng tiền điện', 'Đóng tiền điện', d(9, 8), null], // iOS auto-capitalisation
  ['đón bé 5h chiều @anh', 'Đón bé', d(8, 17), 'anh'],
  ['5h đón bé', 'Đón bé', d(8, 17), null], // bare 1–6h means afternoon
  ['tối nay mua bánh sinh nhật', 'Mua bánh sinh nhật', d(8, 19), null],
  ['sáng mai 7h30 cho bé đi tiêm', 'Cho bé đi tiêm', d(9, 7, 30), null],
  ['chiều mốt họp phụ huynh', 'Họp phụ huynh', d(10, 16), null],
  ['thứ 6 tuần sau họp phụ huynh', 'Họp phụ huynh', d(13, 9), null],
  ['thứ sáu 17h30 đón ông bà', 'Đón ông bà', d(13, 17, 30), null],
  ['t2 nộp học phí', 'Nộp học phí', d(9, 9), null],
  ['chủ nhật 20h gọi về quê', 'Gọi về quê', d(8, 20), null], // today, still ahead
  ['cn 10h đi siêu thị', 'Đi siêu thị', d(15, 10), null], // today but 10h passed → next Sunday
  ['12/11 khám răng cho bé', 'Khám răng cho bé', d(12, 9), null],
  ['1/2 đóng bảo hiểm', 'Đóng bảo hiểm', d(1, 9, 0, 1, 2027), null], // past date → next year
  ['9h rưỡi tối dọn bếp', 'Dọn bếp', d(8, 21, 30), null],
  ['trưa 1h ăn với chị Mai', 'Ăn với chị Mai', d(9, 13), null], // "Mai" the name survives; 13h passed → tomorrow
  ['8h giặt đồ', 'Giặt đồ', d(9, 8), null], // 8h already passed → tomorrow
  ['mua 2 hộp trứng', 'Mua 2 hộp trứng', null, null], // bare numbers are not times
  ['hôm nay @Em gọi điện cô giáo', 'Gọi điện cô giáo', d(8, 9), 'em'],
  ['mai', 'Mai', d(9, 9), null], // nothing left → keep the original text
];

for (const [input, title, due, who] of cases) {
  test(input, () => {
    const r = parseQuickAdd(input, NOW);
    assert.equal(r.title, title);
    assert.equal(r.dueAt?.getTime() ?? null, due?.getTime() ?? null,
      `due: got ${r.dueAt?.toString()} want ${due?.toString()}`);
    assert.equal(r.assigneeHint, who);
  });
}

test('dueLabel', () => {
  assert.deepEqual(dueLabel(d(8, 16, 30), NOW), { text: 'Hôm nay 16:30', overdue: false, isToday: true });
  assert.equal(dueLabel(d(9, 8), NOW).text, 'Mai 08:00');
  assert.equal(dueLabel(d(7, 19), NOW).text, 'Hôm qua 19:00');
  assert.equal(dueLabel(d(7, 19), NOW).overdue, true);
  assert.equal(dueLabel(d(11, 17, 30), NOW).text, 'T4 17:30');
  assert.equal(dueLabel(d(20, 9), NOW).text, '20/11 09:00');
});

test('bucketOf', () => {
  assert.equal(bucketOf(null, NOW), 'nodate');
  assert.equal(bucketOf(d(8, 10), NOW), 'overdue');
  assert.equal(bucketOf(d(8, 20), NOW), 'today');
  assert.equal(bucketOf(d(9, 8), NOW), 'upcoming');
});
