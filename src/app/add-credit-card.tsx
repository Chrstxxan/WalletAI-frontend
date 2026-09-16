import { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createCreditCard } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

export default function AddCreditCardScreen() {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
  if (!name.trim()) {
    Alert.alert('Erro', 'Digite o nome do cartão');
    return;
  }
  const limitNum = parseFloat(limit.replace(',', '.'));
  if (!limitNum || limitNum <= 0) {
    Alert.alert('Erro', 'Informe o limite do cartão (obrigatório)');
    return;
  }
  setLoading(true);
  try {
    await createCreditCard(name.trim(), limitNum);
    router.back();
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível criar o cartão');
  } finally {
    setLoading(false);
  }
}

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <BackButton />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Novo cartão</Text>

        <GlassCard style={styles.card}>
          <TextInput
            label="Nome do cartão (ex: Nubank, Itaú)"
            value={name}
            onChangeText={setName}
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Limite do cartão (R$)"
            value={limit}
            onChangeText={setLimit}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
            />
          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Salvar
          </Button>
        </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700', marginBottom: 24 },
  card: {},
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});