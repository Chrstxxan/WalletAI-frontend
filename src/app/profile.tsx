import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Switch, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getMe, updateMe, resetPassword } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Colors } from '@/constants/colors';
import { isAppLockEnabled, isDeviceLockAvailable, setAppLockEnabled, unlockWithDeviceAuth } from '@/utils/appLock';
import { useBottomPadding } from '@/utils/useBottomPadding';

export default function ProfileScreen() {
  const bottomPadding = useBottomPadding(130);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockAvailable, setLockAvailable] = useState(true);
  const [togglingLock, setTogglingLock] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [user, lockOn, lockPossivel] = await Promise.all([
          getMe(),
          isAppLockEnabled(),
          isDeviceLockAvailable(),
        ]);
        setName(user.name || '');
        setEmail(user.email || '');
        setLockEnabled(lockOn);
        setLockAvailable(lockPossivel);
      } catch (error: any) {
        if (error?.isAuthError) {
          // token válido mas usuário não existe mais (ex: banco resetado) — desloga em vez de travar a tela
          await SecureStore.deleteItemAsync('token');
          router.replace('/login');
          return;
        }
        Alert.alert('Erro de conexão', 'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.');
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  async function handleToggleLock(value: boolean) {
    setTogglingLock(true);
    try {
      if (value) {
        const confirmado = await unlockWithDeviceAuth();
        if (!confirmado) {
          Alert.alert('Não foi possível confirmar', 'Tente novamente para ativar o bloqueio.');
          return;
        }
      }
      await setAppLockEnabled(value);
      setLockEnabled(value);
    } finally {
      setTogglingLock(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('token');
          router.replace('/login');
        },
      },
    ]);
  }

  async function handleSaveInfo() {
    setSavingInfo(true);
    try {
      await updateMe(name, email);
      Alert.alert('Sucesso', 'Dados atualizados!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar. O email já pode estar em uso.');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword.trim()) {
      Alert.alert('Erro', 'Digite a nova senha');
      return;
    }
    setSavingPassword(true);
    try {
      await resetPassword(email, newPassword);
      setNewPassword('');
      Alert.alert('Sucesso', 'Senha alterada!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a senha');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadingInitial) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Minha conta</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Dados pessoais</Text>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Button mode="contained" onPress={handleSaveInfo} loading={savingInfo} style={styles.button} buttonColor={Colors.primary}>
            Salvar dados
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Alterar senha</Text>
          <TextInput
            label="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Button mode="contained" onPress={handleChangePassword} loading={savingPassword} style={styles.button} buttonColor={Colors.primary}>
            Alterar senha
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          <View style={styles.lockRow}>
            <View style={styles.lockTextWrap}>
              <Text style={styles.lockLabel}>Bloquear o app</Text>
              <Text style={styles.lockHint}>
                {lockAvailable
                  ? 'Exige biometria ou a senha do aparelho para abrir o WalletAI'
                  : 'Nenhuma biometria ou senha configurada neste aparelho'}
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={handleToggleLock}
              disabled={!lockAvailable || togglingLock}
              color={Colors.primary}
            />
          </View>
        </GlassCard>

        <Button mode="outlined" onPress={() => router.push('/financial-profile')} textColor={Colors.primaryLight} style={styles.linkButton}>
          Meus dados financeiros
        </Button>

        <Button mode="outlined" onPress={() => router.push('/benefit-wallets')} textColor={Colors.primaryLight} style={styles.linkButton}>
          Benefícios de trabalho
        </Button>

        <Button mode="text" onPress={() => router.push({ pathname: '/onboarding', params: { again: '1' } } as any)} textColor={Colors.textSecondary} style={styles.linkButton}>
          Ver tutorial novamente
        </Button>

        <Button mode="text" onPress={confirmLogout} textColor={Colors.textSecondary} style={styles.logoutButton}>
          Sair da conta
        </Button>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 130 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700', marginBottom: 24 },
  card: { marginBottom: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 4, paddingVertical: 4, borderRadius: 12 },
  linkButton: { borderRadius: 12, marginTop: 8 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockTextWrap: { flex: 1 },
  lockLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  lockHint: { color: Colors.textSecondary, fontSize: 12, lineHeight: 16 },
  logoutButton: { marginTop: 20, alignSelf: 'center' },
});