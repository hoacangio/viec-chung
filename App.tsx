import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Centered } from './src/components/ui';
import { useHousehold } from './src/hooks/useHousehold';
import { useSession } from './src/hooks/useSession';
import { configError } from './src/lib/supabase';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainScreen } from './src/screens/MainScreen';
import { PairScreen } from './src/screens/PairScreen';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* On web/desktop keep a phone-width column */}
        <View style={styles.column}>{configError ? <ConfigError /> : <Root />}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Root() {
  const session = useSession();
  if (session === undefined) return <Centered />;
  if (!session) return <AuthScreen />;
  return <SignedIn userId={session.user.id} />;
}

function SignedIn({ userId }: { userId: string }) {
  const { loading, household, members, error, reload } = useHousehold(userId);
  if (loading) return <Centered />;
  if (error)
    return (
      <Centered>
        <View style={{ gap: 12, width: '100%' }}>
          <Banner tone="error">{error}</Banner>
          <Button title="Thử lại" onPress={reload} />
        </View>
      </Centered>
    );
  if (!household) return <PairScreen onDone={reload} />;
  return <MainScreen userId={userId} household={household} members={members} reload={reload} />;
}

function ConfigError() {
  return (
    <Centered>
      <Text style={{ fontSize: 16, color: colors.danger, textAlign: 'center' }}>{configError}</Text>
    </Centered>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: colors.bg },
});
