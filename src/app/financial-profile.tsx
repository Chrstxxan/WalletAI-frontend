import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, IconButton, Switch, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  getFinancialProfile, updateFinancialProfile,
  getIncomeSources, updateIncomeSources,
  getFixedExpenses, updateFixedExpenses,
  getCreditCards,
} from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type IncomeRow = { id?: number; description: string; amount: string; recorrente: boolean; month: string; year: string };
type ExpenseRow = { id?: number; description: string; amount: string; isCreditCard: boolean; cardId: number | null; recorrente: boolean; month: string; year: string };
type CreditCardOption = { id: number; name: string };

const CURRENT_MONTH = String(new Date().getMonth() + 1);
const CURRENT_YEAR = String(new Date().getFullYear());

function emptyIncomeRow(): IncomeRow {
  return { description: '', amount: '', recorrente: true, month: CURRENT_MONTH, year: CURRENT_YEAR };
}
function emptyExpenseRow(): ExpenseRow {
  return { description: '', amount: '', isCreditCard: false, cardId: null, recorrente: true, month: CURRENT_MONTH, year: CURRENT_YEAR };
}

export default function FinancialProfileScreen() {
  const bottomPadding = useBottomPadding(40);
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>([emptyIncomeRow()]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([emptyExpenseRow()]);
  const [creditCards, setCreditCards] = useState<CreditCardOption[]>([]);
  const [workingCapital, setWorkingCapital] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [creditTypes, setCreditTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const profile = await getFinancialProfile();
        setWorkingCapital(profile.workingCapital ? String(profile.workingCapital) : '');
        setSavingsGoal(profile.savingsGoal ? String(profile.savingsGoal) : '');
        setCreditTypes(Array.isArray(profile.creditTypes) ? profile.creditTypes.join(', ') : '');

        const sources = await getIncomeSources();
        if (sources.length > 0) {
          setIncomeRows(sources.map((s: any) => ({
            id: s.id,
            description: s.description,
            amount: String(s.amount),
            recorrente: s.recorrente !== false,
            month: s.month ? String(s.month) : CURRENT_MONTH,
            year: s.year ? String(s.year) : CURRENT_YEAR,
          })));
        }

        const cards = await getCreditCards();
        setCreditCards(cards.map((c: any) => ({ id: c.id, name: c.name })));

        const expenses = await getFixedExpenses();
        if (expenses.length > 0) {
          setExpenseRows(expenses.map((e: any) => ({
            id: e.id,
            description: e.description,
            amount: String(e.amount),
            isCreditCard: !!e.creditCardId,
            cardId: e.creditCardId || null,
            recorrente: e.recorrente !== false,
            month: e.month ? String(e.month) : CURRENT_MONTH,
            year: e.year ? String(e.year) : CURRENT_YEAR,
          })));
        }
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  function addIncomeRow() {
    setIncomeRows([...incomeRows, emptyIncomeRow()]);
  }
  function removeIncomeRow(index: number) {
    setIncomeRows(incomeRows.filter((_, i) => i !== index));
  }
  function updateIncomeRow(index: number, field: keyof IncomeRow, value: any) {
    const updated = [...incomeRows];
    (updated[index] as any)[field] = value;
    setIncomeRows(updated);
  }

  function addExpenseRow() {
    setExpenseRows([...expenseRows, emptyExpenseRow()]);
  }
  function removeExpenseRow(index: number) {
    setExpenseRows(expenseRows.filter((_, i) => i !== index));
  }
  function updateExpenseRow(index: number, field: keyof ExpenseRow, value: any) {
    const updated = [...expenseRows];
    (updated[index] as any)[field] = value;
    setExpenseRows(updated);
  }

  const totalRenda = incomeRows.reduce((sum, row) => sum + (parseFloat(row.amount.replace(',', '.')) || 0), 0);
  const totalDespesas = expenseRows.reduce((sum, row) => sum + (parseFloat(row.amount.replace(',', '.')) || 0), 0);

  function toValidIncomeList(rows: IncomeRow[]) {
    return rows
      .filter(row => row.description.trim() && row.amount.trim())
      .map(row => ({
        id: row.id,
        description: row.description.trim(),
        amount: parseFloat(row.amount.replace(',', '.')) || 0,
        recorrente: row.recorrente,
        month: row.recorrente ? undefined : parseInt(row.month) || undefined,
        year: row.recorrente ? undefined : parseInt(row.year) || undefined,
      }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const creditTypesArray = creditTypes.split(',').map(c => c.trim()).filter(Boolean);

      await updateFinancialProfile(
        parseFloat(workingCapital.replace(',', '.')) || 0,
        parseFloat(savingsGoal.replace(',', '.')) || 0,
        creditTypesArray
      );
      await updateIncomeSources(toValidIncomeList(incomeRows));

      const despesasValidas = expenseRows.filter(r => r.description.trim() && r.amount.trim() && (!r.isCreditCard || r.cardId));
      await updateFixedExpenses(despesasValidas.map(r => ({
        id: r.id,
        description: r.description.trim(),
        amount: parseFloat(r.amount.replace(',', '.')) || 0,
        recorrente: r.recorrente,
        month: r.recorrente ? undefined : parseInt(r.month) || undefined,
        year: r.recorrente ? undefined : parseInt(r.year) || undefined,
        creditCardId: r.isCreditCard ? r.cardId : null,
      })));

      Alert.alert('Sucesso', 'Dados financeiros atualizados!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    } finally {
      setLoading(false);
    }
  }

  if (loadingInitial) {
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Meus dados financeiros</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Usados para calcular quanto você pode gastar</Text>

        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fontes de renda</Text>
            <Text style={styles.totalValue}>R$ {totalRenda.toFixed(2)}</Text>
          </View>

          {incomeRows.map((row, index) => (
            <View key={index} style={styles.expenseBlock}>
              <View style={styles.itemRow}>
                <TextInput
                  label="Ex: Salário, Freelance..."
                  value={row.description}
                  onChangeText={(v) => updateIncomeRow(index, 'description', v)}
                  mode="flat"
                  style={[styles.input, styles.descInput]}
                  underlineColor="transparent"
                  textColor={Colors.textPrimary}
                />
                <TextInput
                  label="R$"
                  value={row.amount}
                  onChangeText={(v) => updateIncomeRow(index, 'amount', v)}
                  keyboardType="decimal-pad"
                  mode="flat"
                  style={[styles.input, styles.amountInput]}
                  underlineColor="transparent"
                  textColor={Colors.textPrimary}
                />
                <IconButton icon="close" iconColor={Colors.textSecondary} size={18} onPress={() => removeIncomeRow(index)} />
              </View>

              <View style={styles.toggleRow}>
                <Switch
                  value={row.recorrente}
                  onValueChange={(v) => updateIncomeRow(index, 'recorrente', v)}
                  color={Colors.primary}
                />
                <Text style={styles.toggleLabel}>{row.recorrente ? 'Recorrente (todo mês)' : 'Pontual (só um mês)'}</Text>
              </View>

              {!row.recorrente && (
                <View style={styles.rowInputs}>
                  <TextInput
                    label="Mês (1-12)"
                    value={row.month}
                    onChangeText={(v) => updateIncomeRow(index, 'month', v)}
                    keyboardType="number-pad"
                    mode="flat"
                    style={[styles.input, styles.halfInput]}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <TextInput
                    label="Ano"
                    value={row.year}
                    onChangeText={(v) => updateIncomeRow(index, 'year', v)}
                    keyboardType="number-pad"
                    mode="flat"
                    style={[styles.input, styles.halfInput]}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                </View>
              )}
            </View>
          ))}

          <Button mode="text" onPress={addIncomeRow} textColor={Colors.primaryLight} style={{ alignSelf: 'flex-start' }}>
            + Adicionar fonte de renda
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Despesas fixas</Text>
            <Text style={[styles.totalValue, { color: '#FF6B6B' }]}>R$ {totalDespesas.toFixed(2)}</Text>
          </View>

          {expenseRows.map((row, index) => (
            <View key={index} style={styles.expenseBlock}>
              <View style={styles.itemRow}>
                <TextInput
                  label="Ex: Aluguel, Internet, Luz..."
                  value={row.description}
                  onChangeText={(v) => updateExpenseRow(index, 'description', v)}
                  mode="flat"
                  style={[styles.input, styles.descInput]}
                  underlineColor="transparent"
                  textColor={Colors.textPrimary}
                />
                <TextInput
                  label="R$"
                  value={row.amount}
                  onChangeText={(v) => updateExpenseRow(index, 'amount', v)}
                  keyboardType="decimal-pad"
                  mode="flat"
                  style={[styles.input, styles.amountInput]}
                  underlineColor="transparent"
                  textColor={Colors.textPrimary}
                />
                <IconButton icon="close" iconColor={Colors.textSecondary} size={18} onPress={() => removeExpenseRow(index)} />
              </View>

              {creditCards.length > 0 && (
                <View style={styles.toggleRow}>
                  <Switch
                    value={row.isCreditCard}
                    onValueChange={(v) => updateExpenseRow(index, 'isCreditCard', v)}
                    color={Colors.primary}
                  />
                  <Text style={styles.toggleLabel}>Essa despesa é no cartão de crédito</Text>
                </View>
              )}

              <View style={styles.toggleRow}>
                <Switch
                  value={row.recorrente}
                  onValueChange={(v) => updateExpenseRow(index, 'recorrente', v)}
                  color={Colors.primary}
                />
                <Text style={styles.toggleLabel}>{row.recorrente ? 'Recorrente (todo mês)' : 'Pontual (só um mês)'}</Text>
              </View>

              {!row.recorrente && (
                <View style={styles.rowInputs}>
                  <TextInput
                    label="Mês (1-12)"
                    value={row.month}
                    onChangeText={(v) => updateExpenseRow(index, 'month', v)}
                    keyboardType="number-pad"
                    mode="flat"
                    style={[styles.input, styles.halfInput]}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <TextInput
                    label="Ano"
                    value={row.year}
                    onChangeText={(v) => updateExpenseRow(index, 'year', v)}
                    keyboardType="number-pad"
                    mode="flat"
                    style={[styles.input, styles.halfInput]}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                </View>
              )}

              {row.isCreditCard && (
                <View style={styles.chipsRow}>
                  {creditCards.map((c) => (
                    <Chip
                      key={c.id}
                      selected={row.cardId === c.id}
                      onPress={() => updateExpenseRow(index, 'cardId', c.id)}
                      style={[styles.chip, row.cardId === c.id && styles.chipSelected]}
                      textStyle={{ color: Colors.textPrimary, fontSize: 12 }}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </View>
              )}

              {row.isCreditCard && row.cardId && (
                <Text style={styles.cardHelperText}>
                  {row.recorrente
                    ? 'Essa cobrança entra automaticamente na fatura desse cartão todo mês, até você remover ou desmarcar.'
                    : 'Entra só na fatura do mês/ano escolhido acima.'}
                </Text>
              )}
            </View>
          ))}

          <Button mode="text" onPress={addExpenseRow} textColor={Colors.primaryLight} style={{ alignSelf: 'flex-start' }}>
            + Adicionar despesa fixa
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <TextInput
            label="Meta de economia mensal / pé de meia (R$)"
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Text style={styles.helperText}>
            Esse valor é reservado automaticamente — o quanto você pode gastar já vem descontando essa meta.
          </Text>
          <TextInput
            label="Reserva de segurança / capital de giro (R$)"
            value={workingCapital}
            onChangeText={setWorkingCapital}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Text style={styles.helperText}>
            Dinheiro guardado para imprevistos — não entra no cálculo do limite mensal, é só uma referência de segurança.
          </Text>
          <TextInput
            label="Tipos de crédito (separados por vírgula)"
            value={creditTypes}
            onChangeText={setCreditTypes}
            placeholder="Ex: Cartão de crédito, Empréstimo"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button} buttonColor={Colors.primary}>
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
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: Colors.primaryLight, fontSize: 16, fontWeight: '700' },
  expenseBlock: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  descInput: { flex: 2, marginRight: 4 },
  amountInput: { flex: 1 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  toggleLabel: { color: Colors.textSecondary, fontSize: 13, marginLeft: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: Colors.inputBackground },
  chipSelected: { backgroundColor: `${Colors.primary}33` },
  helperText: { color: Colors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 16, paddingHorizontal: 4 },
  cardHelperText: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, marginBottom: 4 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});