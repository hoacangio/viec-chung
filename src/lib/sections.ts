import type { Item, ItemKind } from '../types';
import { BUCKET_LABEL, bucketOf, type Bucket } from './format';

export type Section = { key: string; title: string; data: Item[] };

const time = (s: string | null) => (s ? new Date(s).getTime() : 0);

/**
 * Group items for the list.
 * Tasks: Quá hạn → Hôm nay → Sắp tới → Không hạn → Đã xong. Shopping: Cần mua → Đã mua.
 * `filter` = a member's user id (their tasks only) or 'all'.
 */
export function buildSections(
  items: Item[],
  kind: ItemKind,
  filter: string,
  showDone: boolean,
  now: Date = new Date(),
  doneLimit = 30,
): { sections: Section[]; doneCount: number } {
  const mine = items.filter((i) => i.kind === kind && (filter === 'all' || i.assignee_id === filter));
  const open = mine.filter((i) => !i.done);
  const done = mine
    .filter((i) => i.done)
    .sort((a, b) => time(b.done_at) - time(a.done_at));

  const sections: Section[] = [];

  if (kind === 'task') {
    const order: Bucket[] = ['overdue', 'today', 'upcoming', 'nodate'];
    const groups = new Map<Bucket, Item[]>(order.map((b) => [b, []]));
    for (const it of open) groups.get(bucketOf(it.due_at ? new Date(it.due_at) : null, now))!.push(it);
    for (const b of order) {
      const data = groups.get(b)!;
      if (!data.length) continue;
      data.sort((a, b2) =>
        b === 'nodate' ? time(a.created_at) - time(b2.created_at) : time(a.due_at) - time(b2.due_at),
      );
      sections.push({ key: b, title: `${BUCKET_LABEL[b]} · ${data.length}`, data });
    }
  } else if (open.length) {
    sections.push({
      key: 'open',
      title: `CẦN MUA · ${open.length}`,
      data: open.sort((a, b) => time(a.created_at) - time(b.created_at)),
    });
  }

  if (showDone && done.length) {
    sections.push({
      key: 'done',
      title: kind === 'task' ? 'ĐÃ XONG' : 'ĐÃ MUA',
      data: done.slice(0, doneLimit),
    });
  }

  return { sections, doneCount: done.length };
}
