import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createTransaction, updateTransaction, getBenefitWallets } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type BenefitWallet = { id: number; type: string };

export default function AddTransactionScreen() {
  const bottomPadding = useBottomPadding(24);
  const params = useLocalSearchParams<{ id?: string; amount?: string; type?: string; description?: string; benefitWalletId?: string }>();
  const isEditing = !!params.id;

  const [amount, setAmount] = useState(params.amount || '');
  const [type, setType] = useState(params.type || 'despesa');
  const [description, setDescription] = useState(params.description || '');
  const [wallets, setWallets] = useState<BenefitWallet[]>([]);
  const [benefitWalletId, setBenefitWalletId] = useState(params.benefitWalletId || 'nenhum');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getBenefitWallets().then(setWallets).catch(() => {});
  }, []);

  function handleTypeChange(value: string) {
    setType(value);
    if (value === 'receita') setBenefitWalletId('nenhum');
  }

  async function handleSubmit() {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha valor e descrição');
      return;
    }
    setLoading(true);
    try {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      const walletId = benefitWalletId === 'nenhum' ? null : Number(benefitWalletId);
      if (isEditing) {
        await updateTransaction(Number(params.id), parsedAmount, type, description, walletId);
        Alert.alert('Sucesso', 'Transação atualizada!');
      } else {
        const transaction = await createTransaction(parsedAmount, type, description, walletId);
        Alert.alert('Sucesso', `Categorizado como: ${transaction.category.name}`);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.message || 'Tente novamente.');
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
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Text variant="headlineLarge" style={styles.title}>{isEditing ? 'Editar transação' : 'Nova transação'}</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>A categoria é sugerida automaticamente pela IA</Text>

          <GlassCard style={styles.card}>
            <SegmentedButtons
              value={type}
              onValueChange={handleTypeChange}
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

            {type === 'despesa' && wallets.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Forma de pagamento</Text>
                <SegmentedButtons
                  value={benefitWalletId}
                  onValueChange={setBenefitWalletId}
                  style={styles.segmented}
                  buttons={[
                    { value: 'nenhum', label: 'Débito/Crédito' },
                    ...wallets.map((w) => ({ value: String(w.id), label: w.type })),
                  ]}
                />
              </>
            )}

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
  screen: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  flex: { flex: 1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.25 },
  blobTop: { top: -100, right: -80 },
  blobBottom: { bottom: -80, left: -100 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8 },
  segmented: { marginBottom: 16 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});
