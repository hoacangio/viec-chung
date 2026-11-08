import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AddBar } from '../components/AddBar';
import { ItemRow } from '../components/ItemRow';
import { Avatar, Banner, Button, Centered, Chip } from '../components/ui';
import { useItems } from '../hooks/useItems';
import { buildSections } from '../lib/sections';
import { supabase, viError } from '../lib/supabase';
import { colors, radius } from '../theme';
import type { Household, Item, ItemKind, Member } from '../types';

type Props = { userId: string; household: Household; members: Member[]; reload: () => void };

export function MainScreen({ userId, household, members, reload }: Props) {
  const { items, loading, error, clearError, add, update, remove, refresh } = useItems(household.id);
  const [tab, setTab] = useState<ItemKind>('task');
  const [filter, setFilter] = useState<string>('all');
  const [showDone, setShowDone] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { sections, doneCount } = useMemo(
    () => buildSections(items, tab, tab === 'task' ? filter : 'all', showDone),
    [items, tab, filter, showDone],
  );
  const openCount = (k: ItemKind) => items.filter((i) => i.kind === k && !i.done).length;
  const alone = members.length < 2;

  const onToggleExpand = useCallback((id: string) => setExpanded((cur) => (cur === id ? null : id)), []);
  const onToggleDone = useCallback((it: Item) => update(it.id, { done: !it.done }), [update]);
  const onAssign = useCallback((it: Item, uid: string | null) => update(it.id, { assignee_id: uid }), [update]);
  const onClearDue = useCallback((it: Item) => update(it.id, { due_at: null }), [update]);
  const onDelete = useCallback(
    (it: Item) => {
      setExpanded(null);
      remove([it.id]);
    },
    [remove],
  );

  const clearBought = () =>
    remove(items.filter((i) => i.kind === 'shopping' && i.done).map((i) => i.id));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row' }}>
            {members.map((m, i) => (
              <View key={m.user_id} style={{ marginLeft: i ? -8 : 0, borderWidth: 2, borderColor: '#fff', borderRadius: 18 }}>
                <Avatar name={m.display_name} tone={i} size={32} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{household.name}</Text>
            <Text style={styles.sub}>{members.map((m) => m.display_name).join(' · ')}</Text>
          </View>
          <Button
            title={inviteOpen ? 'Đóng' : alone ? 'Mời' : 'Nhà'}
            variant="secondary"
            onPress={() => setInviteOpen((v) => !v)}
            style={{ minHeight: 40, paddingHorizontal: 14 }}
          />
        </View>

        {(inviteOpen || alone) && (
          <InvitePanel household={household} alone={alone} onChanged={reload} />
        )}

        {/* Tabs */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {(['task', 'shopping'] as ItemKind[]).map((k) => (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k }}
              onPress={() => {
                setTab(k);
                setExpanded(null);
              }}
              style={[styles.tab, tab === k && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>
                {k === 'task' ? 'Việc' : 'Mua sắm'} ({openCount(k)})
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'task' && members.length > 1 && (
          <View style={styles.filters}>
            <Chip label="Tất cả" selected={filter === 'all'} onPress={() => setFilter('all')} />
            {members.map((m, i) => (
              <Chip
                key={m.user_id}
                label={m.user_id === userId ? `Của ${m.display_name} (tôi)` : `Của ${m.display_name}`}
                tone={i}
                selected={filter === m.user_id}
                onPress={() => setFilter(m.user_id)}
              />
            ))}
          </View>
        )}
      </View>

      {error ? (
        <Pressable onPress={clearError} style={{ paddingHorizontal: 16, paddingTop: 10 }} accessibilityRole="button">
          <Banner tone="error">{error} (chạm để ẩn)</Banner>
        </Pressable>
      ) : null}

      {/* List */}
      {loading ? (
        <Centered />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(it) => it.id}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
            />
          }
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              members={members}
              expanded={expanded === item.id}
              onToggleExpand={onToggleExpand}
              onToggleDone={onToggleDone}
              onAssign={onAssign}
              onClearDue={onClearDue}
              onDelete={onDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {tab === 'task' ? 'Chưa có việc nào' : 'Danh sách mua sắm trống'}
              </Text>
              <Text style={styles.emptyText}>
                {tab === 'task'
                  ? 'Gõ ở ô bên dưới, ví dụ: “mai 5h chiều đón bé @anh”. App tự hiểu hạn chót và người làm.'
                  : 'Gõ món cần mua ở ô bên dưới. Ai đang ở siêu thị thì tick, người kia thấy ngay.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            doneCount > 0 ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Button
                  variant="ghost"
                  title={showDone ? 'Ẩn mục đã xong' : `Hiện ${doneCount} mục đã xong`}
                  onPress={() => setShowDone((v) => !v)}
                />
                {tab === 'shopping' && showDone && (
                  <Button variant="danger" title="Xoá các món đã mua" onPress={clearBought} />
                )}
              </View>
            ) : null
          }
        />
      )}

      <AddBar kind={tab} members={members} onAdd={add} />
    </KeyboardAvoidingView>
  );
}

function InvitePanel({ household, alone, onChanged }: { household: Household; alone: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid =
    household.invite_code && household.invite_expires_at && new Date(household.invite_expires_at) > new Date();

  const newCode = async () => {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('new_invite_code', { p_household: household.id });
    if (error) setErr(viError(error));
    else onChanged();
    setBusy(false);
  };

  const share = async () => {
    if (!household.invite_code) return;
    const message = `Vào "Việc chung" với mình nhé. Mã mời: ${household.invite_code}`;
    try {
      await Share.share({ message });
    } catch {
      // Web without navigator.share: nothing to do, the code is on screen.
    }
  };

  return (
    <View style={styles.invite}>
      {alone && <Text style={styles.inviteLead}>Mời vợ/chồng vào Nhà để cùng thấy việc.</Text>}
      {valid ? (
        <>
          <Text selectable style={styles.code} accessibilityLabel={`Mã mời ${household.invite_code}`}>
            {household.invite_code}
          </Text>
          <Text style={styles.sub}>Dùng một lần, hết hạn sau 24 giờ.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Gửi mã" onPress={share} style={{ flex: 1 }} />
            <Button title="Mã mới" variant="secondary" onPress={newCode} loading={busy} style={{ flex: 1 }} />
          </View>
        </>
      ) : (
        <Button title="Tạo mã mời" onPress={newCode} loading={busy} />
      )}
      {err ? <Banner tone="error">{err}</Banner> : null}
      <Button title="Đăng xuất" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontSize: 20, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted },
  tabs: { flexDirection: 'row', backgroundColor: colors.subtle, borderRadius: radius.md, padding: 4 },
  tab: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabText: { fontSize: 15, color: colors.muted, fontWeight: '500' },
  tabTextOn: { color: colors.text, fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: colors.muted, marginTop: 8, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  invite: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 14, gap: 10 },
  inviteLead: { fontSize: 15, fontWeight: '600', color: colors.primaryText },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 6, color: colors.primaryText, textAlign: 'center' },
});
