/**
 * Parse a Vietnamese quick-add line into a task title, due date and assignee hint.
 *
 *   "mai 8h đóng tiền điện"        → "Đóng tiền điện", tomorrow 08:00
 *   "đón bé 5h chiều @anh"         → "Đón bé", today 17:00, assignee "anh"
 *   "thứ 6 tuần sau họp phụ huynh" → "Họp phụ huynh", next week's Friday 09:00
 *
 * Pure function: `now` is injectable so it is testable.
 */
export type QuickAddResult = {
  title: string;
  dueAt: Date | null;
  assigneeHint: string | null;
};

type Part = 'sáng' | 'trưa' | 'chiều' | 'tối' | 'đêm';

// JS \b does not understand Vietnamese letters, so token edges are spelled out.
const L = '(?<=^|[\\s,.;!?])';
const R = '(?=$|[\\s,.;!?])';
const re = (body: string, flags = 'iu') => new RegExp(`${L}(?:${body})${R}`, flags);

const WEEKDAY_WORDS: Record<string, number> = {
  '2': 1, hai: 1, '3': 2, ba: 2, '4': 3, 'tư': 3, '5': 4, 'năm': 4, '6': 5, 'sáu': 5, '7': 6, 'bảy': 6,
};
const PART_DEFAULT_HOUR: Record<Part, number> = { sáng: 8, trưa: 12, chiều: 16, tối: 19, đêm: 22 };
const DEFAULT_HOUR_FOR_DAY_ONLY = 9;

export function parseQuickAdd(input: string, now: Date = new Date()): QuickAddResult {
  let text = ` ${input.trim()} `;
  const cut = (m: RegExpMatchArray) => {
    text = text.slice(0, m.index!) + ' ' + text.slice(m.index! + m[0].length);
  };
  const find = (r: RegExp) => {
    const m = text.match(r);
    if (m) cut(m);
    return m;
  };

  // 1. Assignee: "@anh", "@Em"
  // (no \p{L} here: keep the regex portable across Hermes versions)
  const at = find(/(?<=^|\s)@([^\s@,.;!?]+)/u);
  const assigneeHint = at ? at[1].toLowerCase() : null;

  // 2. Explicit date "12/11" or "12/11/2026"
  let day: Date | null = null;
  const dm = find(re('(?:ngày\\s+)?(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{4}))?'));
  if (dm) {
    const d = Number(dm[1]);
    const mo = Number(dm[2]) - 1;
    const y = dm[3] ? Number(dm[3]) : now.getFullYear();
    let cand = new Date(y, mo, d);
    if (!dm[3] && cand < startOfDay(now)) cand = new Date(y + 1, mo, d);
    if (cand.getMonth() === mo && cand.getDate() === d) day = cand;
  }

  // 3. Time: "8h", "8h30", "8:30", "8 giờ", "8g", "8h rưỡi"
  let hour: number | null = null;
  let minute = 0;
  const tm = find(re('(\\d{1,2})\\s*(?:h|g|giờ|:)\\s*(\\d{2}|rưỡi)?(?:\\s*(?:phút|p))?'));
  if (tm) {
    const h = Number(tm[1]);
    const mRaw = tm[2];
    const m = mRaw === 'rưỡi' ? 30 : mRaw ? Number(mRaw) : 0;
    if (h <= 23 && m <= 59) {
      hour = h;
      minute = m;
    }
  }

  // 4. Part of day, optionally glued to a day word: "tối nay", "sáng mai", "chiều mốt"
  let part: Part | null = null;
  let offset: number | null = null;
  const pm = find(re('(sáng|trưa|chiều|tối|đêm|khuya)(?:\\s+(nay|mai|mốt))?'));
  if (pm) {
    const p = pm[1].toLowerCase();
    part = (p === 'khuya' ? 'đêm' : p) as Part;
    const glued = pm[2]?.toLowerCase();
    if (glued) offset = glued === 'nay' ? 0 : glued === 'mai' ? 1 : 2;
  }

  // 5. Relative day words. Lowercase "mai" only, so the name "Mai" is left alone.
  if (offset === null && !day) {
    if (find(re('hôm\\s+nay|bữa\\s+nay'))) offset = 0;
    else if (find(re('ngày\\s+mốt|ngày\\s+kia|mốt'))) offset = 2;
    // Lowercase "mai" anywhere; capitalised "Mai" only as the first word (phone auto-capitalisation).
    else if (find(re('[nN]gày\\s+mai|mai', 'u')) || find(/(?<=^\s+)Mai(?=$|[\s,.;!?])/u)) offset = 1;
  }

  // 6. Weekday: "thứ 6", "thứ sáu", "t6", "chủ nhật", "cn" (+ "tuần sau")
  let weekday: number | null = null;
  if (offset === null && !day) {
    const wm = find(re('thứ\\s*(2|3|4|5|6|7|hai|ba|tư|năm|sáu|bảy)|t([2-7])|chủ\\s+nhật|cn'));
    if (wm) {
      const key = (wm[1] ?? wm[2])?.toLowerCase();
      weekday = key ? WEEKDAY_WORDS[key] : 0;
    }
  }
  const nextWeek = !!find(re('tuần\\s+(?:sau|tới)'));

  // ── Resolve hour ──
  if (hour !== null) {
    if (part === 'chiều' || part === 'tối') {
      if (hour < 12) hour += 12;
    } else if (part === 'trưa') {
      if (hour <= 2) hour += 12;
    } else if (part === 'đêm') {
      if (hour >= 6 && hour < 12) hour += 12;
    } else if (part === null && hour >= 1 && hour <= 6) {
      hour += 12; // "5h đón bé" in a family app means 17:00
    }
  } else if (part) {
    hour = PART_DEFAULT_HOUR[part];
  }

  // ── Resolve date ──
  let dueAt: Date | null = null;
  const at_ = (base: Date, h: number, m: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
  const today = startOfDay(now);

  if (day) {
    dueAt = at_(day, hour ?? DEFAULT_HOUR_FOR_DAY_ONLY, minute);
  } else if (offset !== null) {
    dueAt = at_(addDays(today, offset + (nextWeek ? 7 : 0)), hour ?? DEFAULT_HOUR_FOR_DAY_ONLY, minute);
  } else if (weekday !== null) {
    const h = hour ?? DEFAULT_HOUR_FOR_DAY_ONLY;
    if (nextWeek) {
      // Vietnamese weeks run Monday → Sunday: "thứ 6 tuần sau" = Friday of next calendar week.
      const monday = addDays(today, -((today.getDay() + 6) % 7));
      dueAt = at_(addDays(monday, 7 + ((weekday + 6) % 7)), h, minute);
    } else {
      let diff = (weekday - today.getDay() + 7) % 7;
      if (diff === 0 && at_(today, h, minute) <= now) diff = 7;
      dueAt = at_(addDays(today, diff), h, minute);
    }
  } else if (nextWeek) {
    dueAt = at_(addDays(today, 7), hour ?? DEFAULT_HOUR_FOR_DAY_ONLY, minute);
  } else if (hour !== null) {
    dueAt = at_(today, hour, minute);
    if (dueAt <= now) dueAt = addDays(dueAt, 1);
  }

  let title = text.replace(/\s+/g, ' ').replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '').trim();
  if (!title) title = input.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, dueAt, assigneeHint };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
