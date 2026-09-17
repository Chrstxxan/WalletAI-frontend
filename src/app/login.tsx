import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { login } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';
import { resolvePostAuthRoute } from '@/utils/postAuthRoute';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const dest = await resolvePostAuthRoute();
        router.replace(dest as any);
      } else {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  async function handleLogin() {
    setLoading(true);
    try {
      const data = await login(email, password);
      await SecureStore.setItemAsync('token', data.token);
      const dest = await resolvePostAuthRoute();
      router.replace(dest as any);
    } catch (error) {
      if (error instanceof TypeError) {
        Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o celular está na mesma rede Wi-Fi.');
      } else {
        Alert.alert('Erro', 'Email ou senha inválidos');
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>WalletAI</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Gestão financeira inteligente</Text>

        <GlassCard style={styles.card}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Entrar
          </Button>

          <Button mode="text" onPress={() => router.push('/register')} textColor={Colors.primaryLight}>
            Não tem conta? Cadastre-se
          </Button>

          <Button mode="text" onPress={() => router.push('/forgot-password')} textColor={Colors.textSecondary}>
            Esqueceu a senha?
          </Button>
        </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  flex: { flex: 1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.25 },
  blobTop: { top: -100, right: -80 },
  blobBottom: { bottom: -80, left: -100 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});