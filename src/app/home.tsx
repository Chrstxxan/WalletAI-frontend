import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <Text variant="headlineMedium" style={styles.title}>Bem-vindo ao WalletAI!</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Login funcionando de ponta a ponta. As telas de transações e dashboard vêm aqui.
          </Text>
          <Button mode="contained" onPress={() => router.push('/transactions')} buttonColor={Colors.primary} style={styles.button}>
            Ver transações
          </Button>
          <Button mode="outlined" onPress={handleLogout} textColor={Colors.primaryLight} style={[styles.button, { marginTop: 8 }]}>
            Sair
          </Button>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.25 },
  blobTop: { top: -100, right: -80 },
  blobBottom: { bottom: -80, left: -100 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { marginTop: 8 },
  title: { color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: { borderColor: Colors.primary, borderRadius: 12 },
});