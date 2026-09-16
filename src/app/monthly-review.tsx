import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  getMonthlyFixedExpenseRecords, toggleFixedExpensePaid, generateMonthlyFixedExpenses,
  getMonthlyIncomeRecords, toggleIncomeReceived, generateMonthlyIncome,
} from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

type ExpenseRecord = { id: number; description: string; amount: number; isPaid: boolean };
type IncomeRecordType = { id: number; description: string; amount: number; isReceived: boolean };

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function MonthlyReviewScreen() {
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const now = new Date();
  const mesAtual = `${MESES[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([generateMonthlyFixedExpenses(), generateMonthlyIncome()]);
        const [expenses, incomes] = await Promise.all([getMonthlyFixedExpenseRecords(), getMonthlyIncomeRecords()]);
        setExpenseRecords(expenses);
        setIncomeRecords(incomes);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggleExpense(record: ExpenseRecord) {
    try {
      const updated = await toggleFixedExpensePaid(record.id);
      setExpenseRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  }

  async function handleToggleIncome(record: IncomeRecordType) {
    try {
      const updated = await toggleIncomeReceived(record.id);
      setIncomeRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  }

  const totalPago = expenseRecords.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);
  const totalPendenteDespesa = expenseRecords.filter(r => !r.isPaid).reduce((s, r) => s + r.amount, 0);
  const totalRecebido = incomeRecords.filter(r => r.isReceived).reduce((s, r) => s + r.amount, 0);
  const totalPendenteRenda = incomeRecords.filter(r => !r.isReceived).reduce((s, r) => s + r.amount, 0);

  if (loading) {
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>{mesAtual}</Text>
        <Text style={styles.subtitle}>Marque o que já foi pago ou recebido</Text>

        <Text style={styles.sectionLabel}>Renda</Text>
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Recebido</Text>
            <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>R$ {totalRecebido.toFixed(2)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>A receber</Text>
            <Text style={[styles.summaryValue, { color: '#FFB74D' }]}>R$ {totalPendenteRenda.toFixed(2)}</Text>
          </GlassCard>
        </View>

        {incomeRecords.length === 0 ? (
          <GlassCard style={styles.card}>
            <Text style={styles.emptyText}>Nenhuma fonte de renda cadastrada.{'\n'}Adicione em "Meus dados financeiros".</Text>
          </GlassCard>
        ) : (
          incomeRecords.map(record => (
            <GlassCard key={record.id} style={[styles.card, record.isReceived && styles.cardPaid]}>
              <View style={styles.recordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recordDescription, record.isReceived && styles.textPaid]}>{record.description}</Text>
                  <Text style={styles.recordAmount}>R$ {record.amount.toFixed(2)}</Text>
                </View>
                <Button
                  mode={record.isReceived ? 'contained' : 'outlined'}
                  onPress={() => handleToggleIncome(record)}
                  buttonColor={record.isReceived ? Colors.primary : undefined}
                  textColor={record.isReceived ? '#fff' : Colors.primaryLight}
                  style={styles.toggleButton}
                  compact
                >
                  {record.isReceived ? '✓ Recebido' : 'Marcar recebido'}
                </Button>
              </View>
            </GlassCard>
          ))
        )}

        <Text style={styles.sectionLabel}>Despesas fixas</Text>
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pago</Text>
            <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>R$ {totalPago.toFixed(2)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pendente</Text>
            <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>R$ {totalPendenteDespesa.toFixed(2)}</Text>
          </GlassCard>
        </View>

        {expenseRecords.length === 0 ? (
          <GlassCard style={styles.card}>
            <Text style={styles.emptyText}>Nenhuma despesa fixa cadastrada.{'\n'}Adicione em "Meus dados financeiros".</Text>
          </GlassCard>
        ) : (
          expenseRecords.map(record => (
            <GlassCard key={record.id} style={[styles.card, record.isPaid && styles.cardPaid]}>
              <View style={styles.recordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recordDescription, record.isPaid && styles.textPaid]}>{record.description}</Text>
                  <Text style={styles.recordAmount}>R$ {record.amount.toFixed(2)}</Text>
                </View>
                <Button
                  mode={record.isPaid ? 'contained' : 'outlined'}
                  onPress={() => handleToggleExpense(record)}
                  buttonColor={record.isPaid ? Colors.primary : undefined}
                  textColor={record.isPaid ? '#fff' : Colors.primaryLight}
                  style={styles.toggleButton}
                  compact
                >
                  {record.isPaid ? '✓ Pago' : 'Marcar pago'}
                </Button>
              </View>
            </GlassCard>
          ))
        )}

        <Button mode="contained" onPress={() => router.replace('/home')} buttonColor={Colors.primary} style={styles.doneButton}>
          Ir para o início
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20, textAlign: 'center' },
  sectionLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  card: { marginBottom: 12 },
  cardPaid: { opacity: 0.6 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordDescription: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  recordAmount: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  textPaid: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  toggleButton: { borderRadius: 10 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  doneButton: { marginTop: 16, borderRadius: 12, paddingVertical: 4 },
});