import { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { register } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!name.trim()) {
      Alert.alert('Erro', 'Preencha seu nome');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email, password);
      Alert.alert('Sucesso', 'Conta criada! Faça login.');
      router.back();
    } catch (error) {
      if (error instanceof TypeError) {
        Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o celular está na mesma rede Wi-Fi.');
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar (email já existe?)');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <BackButton />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Criar conta</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Comece a organizar suas finanças</Text>

        <GlassCard style={styles.card}>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            textContentType="name"
            autoComplete="name"
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
            textContentType="newPassword"
            autoComplete="new-password"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Cadastrar
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