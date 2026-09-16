import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/colors';
import { unlockWithDeviceAuth } from '@/utils/appLock';
import { resolvePostAuthRoute } from '@/utils/postAuthRoute';

export default function AppLockScreen() {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  const tryUnlock = useCallback(async () => {
    setChecking(true);
    setFailed(false);
    try {
      const success = await unlockWithDeviceAuth();
      if (success) {
        const dest = await resolvePostAuthRoute();
        router.replace(dest as any);
      } else {
        setFailed(true);
      }
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <View style={styles.content}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text variant="headlineMedium" style={styles.title}>WalletAI bloqueado</Text>
        <Text style={styles.subtitle}>
          {checking
            ? 'Aguardando confirmação...'
            : failed
              ? 'Não foi possível desbloquear. Tente novamente.'
              : 'Use a biometria ou a senha do aparelho para continuar.'}
        </Text>

        {checking ? (
          <ActivityIndicator color={Colors.primary} style={styles.spinner} />
        ) : (
          <Button mode="contained" onPress={tryUnlock} buttonColor={Colors.primary} style={styles.button}>
            Desbloquear
          </Button>
        )}

        <Button mode="text" onPress={handleLogout} textColor={Colors.textSecondary} style={styles.logoutButton}>
          Sair da conta
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logo: { width: 96, height: 96, marginBottom: 24 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 28 },
  spinner: { marginTop: 8 },
  button: { borderRadius: 14, paddingVertical: 4, width: '100%' },
  logoutButton: { marginTop: 20 },
});
