import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const configError =
  !url || !anonKey
    ? 'Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY trong file .env'
    : null;

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing', {
  auth: {
    // Web uses localStorage (the default); native persists the session in AsyncStorage.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Native: refresh tokens only while the app is in the foreground (Supabase's recommended pattern).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Map server error codes/messages to short Vietnamese text. */
export function viError(e: { message?: string } | null | undefined): string {
  const m = e?.message ?? '';
  const map: Record<string, string> = {
    'Invalid login credentials': 'Sai email hoặc mật khẩu.',
    'User already registered': 'Email này đã có tài khoản, hãy đăng nhập.',
    'Email not confirmed': 'Email chưa được xác nhận. Mở email để xác nhận trước.',
    already_in_household: 'Bạn đã ở trong một Nhà rồi.',
    too_many_attempts: 'Nhập sai quá nhiều lần. Thử lại sau 1 tiếng.',
    household_full: 'Nhà này đã đủ người.',
    not_a_member: 'Bạn không thuộc Nhà này.',
    'assignee must be a household member': 'Người được giao không ở trong Nhà.',
  };
  for (const [k, v] of Object.entries(map)) if (m.includes(k)) return v;
  if (/fetch|network/i.test(m)) return 'Mất kết nối mạng. Thử lại nhé.';
  if (/Password should be/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  return m || 'Có lỗi xảy ra.';
}
