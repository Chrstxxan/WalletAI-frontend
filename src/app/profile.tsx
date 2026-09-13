import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getMe, updateMe, resetPassword } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const user = await getMe();
        setName(user.name || '');
        setEmail(user.email || '');
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

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
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
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
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Button mode="contained" onPress={handleChangePassword} loading={savingPassword} style={styles.button} buttonColor={Colors.primary}>
            Alterar senha
          </Button>
        </GlassCard>

        <Button mode="outlined" onPress={() => router.push('/financial-profile')} textColor={Colors.primaryLight} style={styles.linkButton}>
          Meus dados financeiros
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700', marginBottom: 24 },
  card: { marginBottom: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 4, paddingVertical: 4, borderRadius: 12 },
  linkButton: { borderRadius: 12, marginTop: 8 },
});