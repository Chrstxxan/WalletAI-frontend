import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getCreditCards, addInvoiceItem } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

type Card = { id: number; name: string };

export default function AddInvoiceItemScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [loading, setLoading] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await getCreditCards();
        setCards(data);
        if (data.length > 0) setSelectedCardId(data[0].id);
      } finally {
        setLoadingCards(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!selectedCardId) {
      Alert.alert('Erro', 'Selecione um cartão');
      return;
    }
    if (!description.trim() || !installmentAmount) {
      Alert.alert('Erro', 'Preencha a descrição e o valor da parcela');
      return;
    }
    setLoading(true);
    try {
      await addInvoiceItem(
        selectedCardId,
        parseInt(month),
        parseInt(year),
        description.trim(),
        parseFloat(installmentAmount.replace(',', '.')) || 0,
        parseInt(currentInstallment) || 1,
        parseInt(totalInstallments) || 1
      );
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível lançar o item');
    } finally {
      setLoading(false);
    }
  }

  if (loadingCards) {
    return (
      <View style={styles.screen}>
        <BackButton />
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <BackButton />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Lançar item na fatura</Text>
        <Text style={styles.subtitle}>Copie exatamente como está na fatura do seu banco</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Cartão</Text>
          <View style={styles.chipsRow}>
            {cards.map((card) => (
              <Chip
                key={card.id}
                selected={selectedCardId === card.id}
                onPress={() => setSelectedCardId(card.id)}
                style={[styles.chip, selectedCardId === card.id && styles.chipSelected]}
                textStyle={{ color: Colors.textPrimary }}
              >
                {card.name}
              </Chip>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Qual fatura?</Text>
          <View style={styles.rowInputs}>
            <TextInput
              label="Mês (1-12)"
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              mode="flat"
              style={[styles.input, styles.halfInput]}
              underlineColor="transparent"
              textColor={Colors.textPrimary}
            />
            <TextInput
              label="Ano"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              mode="flat"
              style={[styles.input, styles.halfInput]}
              underlineColor="transparent"
              textColor={Colors.textPrimary}
            />
          </View>

          <TextInput
            label="Descrição (ex: Notebook, Celular...)"
            value={description}
            onChangeText={setDescription}
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Valor desta parcela (R$)"
            value={installmentAmount}
            onChangeText={setInstallmentAmount}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <View style={styles.rowInputs}>
            <TextInput
              label="Parcela atual"
              value={currentInstallment}
              onChangeText={setCurrentInstallment}
              keyboardType="number-pad"
              mode="flat"
              style={[styles.input, styles.halfInput]}
              underlineColor="transparent"
              textColor={Colors.textPrimary}
            />
            <TextInput
              label="Total de parcelas"
              value={totalInstallments}
              onChangeText={setTotalInstallments}
              keyboardType="number-pad"
              mode="flat"
              style={[styles.input, styles.halfInput]}
              underlineColor="transparent"
              textColor={Colors.textPrimary}
            />
          </View>

          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Salvar
          </Button>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, fontSize: 13, marginBottom: 24 },
  card: {},
  sectionTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: Colors.inputBackground },
  chipSelected: { backgroundColor: `${Colors.primary}33` },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});