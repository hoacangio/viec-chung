import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Field } from '../components/ui';
import { supabase, viError } from '../lib/supabase';
import { colors } from '../theme';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || password.length < 6) {
      setError('Nhập email và mật khẩu (ít nhất 6 ký tự).');
      return;
    }
    setBusy(true);
    if (mode === 'signin') {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (e) setError(viError(e));
    } else {
      const { data, error: e } = await supabase.auth.signUp({ email: email.trim(), password });
      if (e) setError(viError(e));
      else if (!data.session) setInfo('Đã gửi email xác nhận. Bấm link trong email rồi quay lại đăng nhập.');
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Text style={styles.h1}>Việc chung</Text>
          <Text style={styles.sub}>Việc nhà và đồ cần mua của hai vợ chồng, luôn đồng bộ trên cả hai máy.</Text>
        </View>

        <View style={{ gap: 14 }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <Field
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            onSubmitEditing={submit}
          />
          {error ? <Banner tone="error">{error}</Banner> : null}
          {info ? <Banner>{info}</Banner> : null}
          <Button title={mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'} onPress={submit} loading={busy} />
          <Button
            variant="ghost"
            title={mode === 'signin' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 32 },
  h1: { fontSize: 32, fontWeight: '700', color: colors.text },
  sub: { fontSize: 16, lineHeight: 23, color: colors.muted },
});
