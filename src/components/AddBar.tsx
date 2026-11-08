import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { dueLabel } from '../lib/format';
import { parseQuickAdd } from '../lib/quickAdd';
import type { NewItem } from '../hooks/useItems';
import { colors, radius } from '../theme';
import type { ItemKind, Member } from '../types';
import { Chip } from './ui';

type Props = {
  kind: ItemKind;
  members: Member[];
  onAdd: (item: NewItem) => Promise<boolean>;
};

/** Match "@anh" / "@em" against display names (prefix, accent-insensitive). */
function matchMember(hint: string | null, members: Member[]) {
  if (!hint) return null;
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const h = norm(hint);
  return members.find((m) => norm(m.display_name).startsWith(h)) ?? null;
}

export function AddBar({ kind, members, onAdd }: Props) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const parsed = useMemo(() => (kind === 'task' && text.trim() ? parseQuickAdd(text) : null), [kind, text]);
  const hinted = matchMember(parsed?.assigneeHint ?? null, members);
  const effectiveAssignee = hinted?.user_id ?? assignee;

  const submit = async () => {
    const raw = text.trim();
    if (!raw || busy) return;
    setBusy(true);
    const item: NewItem =
      kind === 'task' && parsed
        ? {
            kind,
            title: parsed.title,
            due_at: parsed.dueAt ? parsed.dueAt.toISOString() : null,
            assignee_id: effectiveAssignee,
          }
        : { kind, title: raw, due_at: null, assignee_id: null };
    setText(''); // clear immediately; the optimistic row is already on screen
    const ok = await onAdd(item);
    if (!ok) setText(raw);
    setBusy(false);
    inputRef.current?.focus();
  };

  const preview =
    parsed && (parsed.dueAt || hinted)
      ? [parsed.dueAt ? `Hạn: ${dueLabel(parsed.dueAt).text}` : null, hinted ? `Giao: ${hinted.display_name}` : null]
          .filter(Boolean)
          .join(' · ')
      : null;

  return (
    <View style={styles.wrap}>
      {kind === 'task' && (
        <View style={styles.chips}>
          <Chip label="Chưa giao" selected={!effectiveAssignee} onPress={() => setAssignee(null)} />
          {members.map((m, i) => (
            <Chip
              key={m.user_id}
              label={m.display_name}
              tone={i}
              selected={effectiveAssignee === m.user_id}
              onPress={() => setAssignee(m.user_id)}
            />
          ))}
        </View>
      )}
      {preview ? <Text style={styles.preview}>{preview}</Text> : null}
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          blurOnSubmit={false}
          returnKeyType="done"
          accessibilityLabel={kind === 'task' ? 'Thêm việc' : 'Thêm món cần mua'}
          placeholder={kind === 'task' ? 'VD: mai 5h chiều đón bé @anh' : 'VD: 2 hộp trứng'}
          placeholderTextColor="#8A8590"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm"
          onPress={submit}
          disabled={!text.trim() || busy}
          style={({ pressed }) => [styles.send, (!text.trim() || busy) && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.sendText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preview: { fontSize: 13, color: colors.primaryText, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '500' },
});
