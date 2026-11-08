const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad = (n: number) => String(n).padStart(2, '0');
const dayDiff = (a: Date, b: Date) =>
  Math.round(
    (new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
      new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) /
      86_400_000,
  );

/** "Hôm nay 16:30", "Mai 08:00", "Hôm qua 19:00", "T4 17:30", "12/11 09:00" */
export function dueLabel(due: Date, now: Date = new Date()) {
  const diff = dayDiff(due, now);
  const time = `${pad(due.getHours())}:${pad(due.getMinutes())}`;
  let day: string;
  if (diff === 0) day = 'Hôm nay';
  else if (diff === 1) day = 'Mai';
  else if (diff === -1) day = 'Hôm qua';
  else if (diff > 1 && diff < 7) day = WEEKDAY_SHORT[due.getDay()];
  else day = `${pad(due.getDate())}/${pad(due.getMonth() + 1)}`;
  return { text: `${day} ${time}`, overdue: due < now, isToday: diff === 0 };
}

export type Bucket = 'overdue' | 'today' | 'upcoming' | 'nodate';

export function bucketOf(due: Date | null, now: Date = new Date()): Bucket {
  if (!due) return 'nodate';
  if (due < now) return 'overdue';
  return dayDiff(due, now) === 0 ? 'today' : 'upcoming';
}

export const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: 'QUÁ HẠN',
  today: 'HÔM NAY',
  upcoming: 'SẮP TỚI',
  nodate: 'KHÔNG HẠN',
};
