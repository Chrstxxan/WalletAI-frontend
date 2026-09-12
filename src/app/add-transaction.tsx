import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { createTransaction } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('despesa');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha valor e descrição');
      return;
    }
    setLoading(true);
    try {
      const transaction = await createTransaction(parseFloat(amount.replace(',', '.')), type, description);
      Alert.alert('Sucesso', `Categorizado como: ${transaction.category.name}`);
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a transação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Nova transação</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>A categoria é sugerida automaticamente pela IA</Text>

        <GlassCard style={styles.card}>
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            style={styles.segmented}
            buttons={[
              { value: 'despesa', label: 'Despesa' },
              { value: 'receita', label: 'Receita' },
            ]}
          />

          <TextInput
            label="Valor (R$)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: iFood, Uber, Aluguel..."
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Salvar
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
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8 },
  segmented: { marginBottom: 16 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});