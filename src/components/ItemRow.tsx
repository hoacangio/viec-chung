import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dueLabel } from '../lib/format';
import { colors, radius } from '../theme';
import type { Item, Member } from '../types';
import { Avatar, Button, Chip } from './ui';

type Props = {
  item: Item;
  members: Member[];
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleDone: (item: Item) => void;
  onAssign: (item: Item, userId: string | null) => void;
  onClearDue: (item: Item) => void;
  onDelete: (item: Item) => void;
};

function ItemRowImpl({ item, members, expanded, onToggleExpand, onToggleDone, onAssign, onClearDue, onDelete }: Props) {
  const toneOf = (uid: string | null) => members.findIndex((m) => m.user_id === uid);
  const assignee = members.find((m) => m.user_id === item.assignee_id);
  const doneBy = members.find((m) => m.user_id === item.done_by);
  const due = item.due_at ? dueLabel(new Date(item.due_at)) : null;
  const pending = item.id.startsWith('tmp-');

  return (
    <View style={[styles.card, item.done && styles.cardDone, pending && { opacity: 0.6 }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          accessibilityLabel={item.done ? `Bỏ đánh dấu xong: ${item.title}` : `Đánh dấu xong: ${item.title}`}
          onPress={() => onToggleDone(item)}
          hitSlop={8}
          style={[styles.check, item.done && styles.checkOn, item.kind === 'shopping' && { borderRadius: 8 }]}
        >
          {item.done ? <Text style={styles.checkMark}>✓</Text> : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityHint="Mở thêm thao tác"
          onPress={() => onToggleExpand(item.id)}
          style={styles.body}
        >
          <Text style={[styles.title, item.done && styles.titleDone]}>{item.title}</Text>
          {(due || doneBy) && (
            <Text style={styles.meta}>
              {item.done && doneBy
                ? `${doneBy.display_name} đã xong`
                : due
                  ? <Text style={due.overdue ? styles.overdue : undefined}>{due.text}</Text>
                  : null}
            </Text>
          )}
        </Pressable>

        {assignee && !item.done ? <Avatar name={assignee.display_name} tone={toneOf(assignee.user_id)} /> : null}
      </View>

      {expanded && !pending && (
        <View style={styles.actions}>
          {item.kind === 'task' && (
            <View style={styles.chips}>
              <Chip label="Chưa giao" selected={!item.assignee_id} onPress={() => onAssign(item, null)} />
              {members.map((m, i) => (
                <Chip
                  key={m.user_id}
                  label={m.display_name}
                  tone={i}
                  selected={item.assignee_id === m.user_id}
                  onPress={() => onAssign(item, m.user_id)}
                />
              ))}
            </View>
          )}
          <View style={styles.chips}>
            {item.due_at ? <Button title="Bỏ hạn" variant="secondary" onPress={() => onClearDue(item)} /> : null}
            <Button title="Xoá" variant="danger" onPress={() => onDelete(item)} />
          </View>
        </View>
      )}
    </View>
  );
}

export const ItemRow = memo(ItemRowImpl);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  cardDone: { backgroundColor: colors.subtle, borderColor: colors.subtle },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#A8A3AD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkOn: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 15, lineHeight: 18 },
  body: { flex: 1, paddingVertical: 6, gap: 2 },
  title: { fontSize: 16, color: colors.text, fontWeight: '500' },
  titleDone: { color: colors.muted, textDecorationLine: 'line-through', fontWeight: '400' },
  meta: { fontSize: 13, color: colors.muted },
  overdue: { color: colors.danger, fontWeight: '600' },
  actions: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, paddingBottom: 6, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
