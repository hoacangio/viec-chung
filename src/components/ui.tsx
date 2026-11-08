import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, memberPalette, radius } from '../theme';

export function Button(props: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const v = props.variant ?? 'primary';
  const disabled = props.disabled || props.loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={props.onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        v === 'primary' && { backgroundColor: colors.primary },
        v === 'secondary' && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
        v === 'danger' && { backgroundColor: colors.dangerSoft },
        v === 'ghost' && { backgroundColor: 'transparent' },
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        props.style,
      ]}
    >
      {props.loading ? (
        <ActivityIndicator color={v === 'primary' ? '#fff' : colors.primary} />
      ) : (
        <Text
          style={[
            styles.btnText,
            v === 'primary' && { color: '#fff' },
            v === 'danger' && { color: colors.danger },
            v === 'ghost' && { color: colors.primary },
          ]}
        >
          {props.title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A8590"
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Chip(props: { label: string; selected?: boolean; onPress: () => void; tone?: number }) {
  const pal = props.tone !== undefined ? memberPalette[props.tone % memberPalette.length] : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!props.selected }}
      onPress={props.onPress}
      style={[
        styles.chip,
        props.selected && {
          backgroundColor: pal?.bg ?? colors.primarySoft,
          borderColor: pal?.fg ?? colors.primary,
        },
      ]}
    >
      <Text style={[styles.chipText, props.selected && { color: pal?.fg ?? colors.primaryText, fontWeight: '600' }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

export function Avatar({ name, tone, size = 28 }: { name: string; tone: number; size?: number }) {
  const pal = memberPalette[tone % memberPalette.length];
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pal.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: pal.fg, fontWeight: '700', fontSize: size * 0.42 }}>
        {(name.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

export function Banner({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <View style={[styles.banner, tone === 'error' && { backgroundColor: colors.dangerSoft }]}>
      <Text style={{ color: tone === 'error' ? colors.danger : colors.primaryText, fontSize: 14, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

export function Centered({ children }: { children?: ReactNode }) {
  return <View style={styles.centered}>{children ?? <ActivityIndicator color={colors.primary} />}</View>;
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, color: colors.text },
  banner: { padding: 12, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
