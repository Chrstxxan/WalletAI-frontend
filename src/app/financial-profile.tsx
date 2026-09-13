import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  getFinancialProfile, updateFinancialProfile,
  getIncomeSources, updateIncomeSources,
  getFixedExpenses, updateFixedExpenses,
} from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

type Row = { description: string; amount: string };

export default function FinancialProfileScreen() {
  const [incomeRows, setIncomeRows] = useState<Row[]>([{ description: '', amount: '' }]);
  const [expenseRows, setExpenseRows] = useState<Row[]>([{ description: '', amount: '' }]);
  const [workingCapital, setWorkingCapital] = useState('');
  const [creditTypes, setCreditTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const profile = await getFinancialProfile();
        setWorkingCapital(profile.workingCapital ? String(profile.workingCapital) : '');
        setCreditTypes(Array.isArray(profile.creditTypes) ? profile.creditTypes.join(', ') : '');

        const sources = await getIncomeSources();
        if (sources.length > 0) {
          setIncomeRows(sources.map((s: any) => ({ description: s.description, amount: String(s.amount) })));
        }

        const expenses = await getFixedExpenses();
        if (expenses.length > 0) {
          setExpenseRows(expenses.map((e: any) => ({ description: e.description, amount: String(e.amount) })));
        }
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  function addRow(setRows: React.Dispatch<React.SetStateAction<Row[]>>, rows: Row[]) {
    setRows([...rows, { description: '', amount: '' }]);
  }

  function removeRow(setRows: React.Dispatch<React.SetStateAction<Row[]>>, rows: Row[], index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function updateRow(setRows: React.Dispatch<React.SetStateAction<Row[]>>, rows: Row[], index: number, field: keyof Row, value: string) {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  }

  const totalRenda = incomeRows.reduce((sum, row) => sum + (parseFloat(row.amount.replace(',', '.')) || 0), 0);
  const totalDespesas = expenseRows.reduce((sum, row) => sum + (parseFloat(row.amount.replace(',', '.')) || 0), 0);

  function toValidList(rows: Row[]) {
    return rows
      .filter(row => row.description.trim() && row.amount.trim())
      .map(row => ({ description: row.description.trim(), amount: parseFloat(row.amount.replace(',', '.')) || 0 }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const creditTypesArray = creditTypes.split(',').map(c => c.trim()).filter(Boolean);

      await updateFinancialProfile(parseFloat(workingCapital.replace(',', '.')) || 0, creditTypesArray);
      await updateIncomeSources(toValidList(incomeRows));
      await updateFixedExpenses(toValidList(expenseRows));

      Alert.alert('Sucesso', 'Dados financeiros atualizados!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    } finally {
      setLoading(false);
    }
  }

  if (loadingInitial) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Meus dados financeiros</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Usados para calcular quanto você pode gastar</Text>

        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fontes de renda</Text>
            <Text style={styles.totalValue}>R$ {totalRenda.toFixed(2)}</Text>
          </View>

          {incomeRows.map((row, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                label="Ex: Salário, Freelance..."
                value={row.description}
                onChangeText={(v) => updateRow(setIncomeRows, incomeRows, index, 'description', v)}
                mode="flat"
                style={[styles.input, styles.descInput]}
                underlineColor="transparent"
                textColor={Colors.textPrimary}
              />
              <TextInput
                label="R$"
                value={row.amount}
                onChangeText={(v) => updateRow(setIncomeRows, incomeRows, index, 'amount', v)}
                keyboardType="decimal-pad"
                mode="flat"
                style={[styles.input, styles.amountInput]}
                underlineColor="transparent"
                textColor={Colors.textPrimary}
              />
              <IconButton icon="close" iconColor={Colors.textSecondary} size={18} onPress={() => removeRow(setIncomeRows, incomeRows, index)} />
            </View>
          ))}

          <Button mode="text" onPress={() => addRow(setIncomeRows, incomeRows)} textColor={Colors.primaryLight} style={{ alignSelf: 'flex-start' }}>
            + Adicionar fonte de renda
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Despesas fixas</Text>
            <Text style={[styles.totalValue, { color: '#FF6B6B' }]}>R$ {totalDespesas.toFixed(2)}</Text>
          </View>

          {expenseRows.map((row, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                label="Ex: Aluguel, Internet, Luz..."
                value={row.description}
                onChangeText={(v) => updateRow(setExpenseRows, expenseRows, index, 'description', v)}
                mode="flat"
                style={[styles.input, styles.descInput]}
                underlineColor="transparent"
                textColor={Colors.textPrimary}
              />
              <TextInput
                label="R$"
                value={row.amount}
                onChangeText={(v) => updateRow(setExpenseRows, expenseRows, index, 'amount', v)}
                keyboardType="decimal-pad"
                mode="flat"
                style={[styles.input, styles.amountInput]}
                underlineColor="transparent"
                textColor={Colors.textPrimary}
              />
              <IconButton icon="close" iconColor={Colors.textSecondary} size={18} onPress={() => removeRow(setExpenseRows, expenseRows, index)} />
            </View>
          ))}

          <Button mode="text" onPress={() => addRow(setExpenseRows, expenseRows)} textColor={Colors.primaryLight} style={{ alignSelf: 'flex-start' }}>
            + Adicionar despesa fixa
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  totalValue: { color: Colors.primaryLight, fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  descInput: { flex: 2, marginRight: 4 },
  amountInput: { flex: 1 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  helperText: { color: Colors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 16, paddingHorizontal: 4 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});