import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase, viError } from '../lib/supabase';
import type { Item, ItemKind } from '../types';

export type NewItem = {
  kind: ItemKind;
  title: string;
  assignee_id: string | null;
  due_at: string | null;
};
export type ItemChanges = Partial<Pick<Item, 'title' | 'assignee_id' | 'due_at' | 'done'>>;

/**
 * All items of a household, kept live with Supabase Realtime.
 * Writes are optimistic and roll back on error.
 */
export function useItems(householdId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const fetchAll = useCallback(async () => {
    const { data, error: e } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
      .limit(2000);
    if (e) setError(viError(e));
    else {
      setItems((data ?? []) as Item[]);
      setError(null);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    const upsert = (row: Item) =>
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === row.id);
        if (i < 0) return [...prev, row];
        const next = prev.slice();
        next[i] = row;
        return next;
      });
    const filter = `household_id=eq.${householdId}`;

    const channel = supabase
      .channel(`items:${householdId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter }, (p) =>
        upsert(p.new as Item),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter }, (p) =>
        upsert(p.new as Item),
      )
      // DELETE events cannot be filtered server-side; they only carry the id, so drop it if we have it.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (p) => {
        const id = (p.old as { id?: string }).id;
        if (id) setItems((prev) => prev.filter((x) => x.id !== id));
      })
      .subscribe((status) => {
        // (Re)subscribed: refetch to cover anything missed while disconnected.
        if (status === 'SUBSCRIBED') fetchAll();
      });

    const appState = AppState.addEventListener('change', (s) => {
      if (s === 'active') fetchAll();
    });

    return () => {
      supabase.removeChannel(channel);
      appState.remove();
    };
  }, [householdId, fetchAll]);

  const add = useCallback(
    async (input: NewItem) => {
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const optimistic: Item = {
        id: tempId,
        household_id: householdId,
        ...input,
        done: false,
        done_by: null,
        done_at: null,
        created_by: '',
        created_at: now,
        updated_at: now,
      };
      setItems((p) => [...p, optimistic]);
      const { data, error: e } = await supabase
        .from('items')
        .insert({ household_id: householdId, ...input })
        .select()
        .single();
      setItems((p) => {
        const without = p.filter((x) => x.id !== tempId);
        if (e || !data) return without;
        return without.some((x) => x.id === data.id) ? without : [...without, data as Item];
      });
      if (e) setError(viError(e));
      return !e;
    },
    [householdId],
  );

  const update = useCallback(async (id: string, changes: ItemChanges) => {
    const before = itemsRef.current.find((x) => x.id === id);
    if (!before || id.startsWith('tmp-')) return;
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    const { data, error: e } = await supabase.from('items').update(changes).eq('id', id).select().single();
    if (e) {
      setError(viError(e));
      setItems((p) => p.map((x) => (x.id === id ? before : x)));
    } else if (data) {
      setItems((p) => p.map((x) => (x.id === id ? (data as Item) : x)));
    }
  }, []);

  const remove = useCallback(async (ids: string[]) => {
    const real = ids.filter((id) => !id.startsWith('tmp-'));
    if (real.length === 0) return;
    const removed = itemsRef.current.filter((x) => real.includes(x.id));
    setItems((p) => p.filter((x) => !real.includes(x.id)));
    const { error: e } = await supabase.from('items').delete().in('id', real);
    if (e) {
      setError(viError(e));
      setItems((p) => [...p, ...removed]);
    }
  }, []);

  return { items, loading, error, clearError: () => setError(null), add, update, remove, refresh: fetchAll };
}
