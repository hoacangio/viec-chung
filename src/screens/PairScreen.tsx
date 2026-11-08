import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Chip, Field } from '../components/ui';
import { supabase, viError } from '../lib/supabase';
import { colors } from '../theme';

export function PairScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Nhập tên hiển thị, ví dụ "Anh" hoặc "Em".');
    if (mode === 'join' && code.trim().length < 8) return setError('Mã mời có 8 ký tự.');
    setBusy(true);
    if (mode === 'create') {
      const { error: e } = await supabase.rpc('create_household', { p_display_name: name.trim(), p_name: 'Nhà mình' });
      if (e) setError(viError(e));
      else onDone();
    } else {
      const { data, error: e } = await supabase.rpc('join_household', {
        p_code: code.trim(),
        p_display_name: name.trim(),
      });
      if (e) setError(viError(e));
      else if (!data) setError('Mã không đúng hoặc đã hết hạn. Nhờ người kia tạo mã mới.');
      else onDone();
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Text style={styles.h1}>Ghép đôi</Text>
          <Text style={styles.sub}>
            Một người tạo Nhà và gửi mã 8 ký tự cho người kia. Người kia chọn “Tôi có mã” và nhập vào.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Tạo Nhà mới" selected={mode === 'create'} onPress={() => setMode('create')} />
          <Chip label="Tôi có mã" selected={mode === 'join'} onPress={() => setMode('join')} />
        </View>

        <View style={{ gap: 14 }}>
          <Field label="Tên hiển thị của bạn" value={name} onChangeText={setName} placeholder="Anh / Em" maxLength={40} />
          {mode === 'join' && (
            <Field
              label="Mã mời"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              placeholder="VD: K7M2QX9A"
              style={{ letterSpacing: 3, fontSize: 20 }}
              onSubmitEditing={submit}
            />
          )}
          {error ? <Banner tone="error">{error}</Banner> : null}
          <Button title={mode === 'create' ? 'Tạo Nhà' : 'Vào Nhà'} onPress={submit} loading={busy} />
          <Button title="Đăng xuất" variant="ghost" onPress={() => supabase.auth.signOut()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  h1: { fontSize: 30, fontWeight: '700', color: colors.text },
  sub: { fontSize: 16, lineHeight: 23, color: colors.muted },
});
