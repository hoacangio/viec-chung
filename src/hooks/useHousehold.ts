import { useCallback, useEffect, useState } from 'react';
import { supabase, viError } from '../lib/supabase';
import type { Household, Member } from '../types';

type State = {
  loading: boolean;
  household: Household | null;
  members: Member[];
  error: string | null;
};

export function useHousehold(userId: string) {
  const [state, setState] = useState<State>({ loading: true, household: null, members: [], error: null });

  const load = useCallback(async () => {
    const mine = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (mine.error) return setState((s) => ({ ...s, loading: false, error: viError(mine.error) }));
    if (!mine.data) return setState({ loading: false, household: null, members: [], error: null });

    const hid = mine.data.household_id as string;
    const [h, m] = await Promise.all([
      supabase.from('households').select('id, name, invite_code, invite_expires_at').eq('id', hid).single(),
      supabase.from('household_members').select('user_id, display_name, role').eq('household_id', hid).order('joined_at'),
    ]);
    if (h.error || m.error) {
      return setState((s) => ({ ...s, loading: false, error: viError(h.error ?? m.error) }));
    }
    setState({ loading: false, household: h.data as Household, members: (m.data ?? []) as Member[], error: null });
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // When the partner joins (or someone renames themselves), reload.
  const hid = state.household?.id;
  useEffect(() => {
    if (!hid) return;
    const channel = supabase
      .channel(`members:${hid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${hid}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hid, load]);

  return { ...state, reload: load };
}
