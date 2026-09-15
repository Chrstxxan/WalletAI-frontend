import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getMonthSummary, acknowledgeMonth } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

type MonthSummary = {
  monthlyIncome: number;
  totalReceitas: number;
  totalDespesas: number;
  totalFaturaCartoes: number;
  fixedExpenses: number;
  gastosPorCategoria: { categoria: string; valor: number }[];
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function MonthClosingScreen() {
  const { month, year } = useLocalSearchParams<{ month: string; year: string }>();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const monthNum = Number(month);
  const yearNum = Number(year);
  const nomeMes = `${MESES[monthNum - 1] || ''} ${yearNum}`;

  useEffect(() => {
    async function load() {
      try {
        const data = await getMonthSummary(monthNum, yearNum);
        setSummary(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [monthNum, yearNum]);

  async function handleContinuar() {
    setConfirming(true);
    try {
      await acknowledgeMonth();
      router.replace('/monthly-review');
    } finally {
      setConfirming(false);
    }
  }

  if (loading || !summary) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const totalGasto = summary.totalDespesas + summary.fixedExpenses + summary.totalFaturaCartoes;
  const totalRecebido = summary.monthlyIncome + summary.totalReceitas;
  const saldo = totalRecebido - totalGasto;

  const topCategoria = summary.gastosPorCategoria.length > 0
    ? summary.gastosPorCategoria.reduce((max, c) => (c.valor > max.valor ? c : max))
    : null;

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Fechamento do mês</Text>
        <Text variant="headlineLarge" style={styles.title}>{nomeMes}</Text>
        <Text style={styles.subtitle}>Veja como foi antes de seguir pro mês novo</Text>

        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Recebido</Text>
            <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>R$ {totalRecebido.toFixed(2)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gasto</Text>
            <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>R$ {totalGasto.toFixed(2)}</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Saldo do mês</Text>
          <Text style={[styles.bigNumber, { color: saldo >= 0 ? Colors.primaryLight : '#FF6B6B' }]}>
            R$ {saldo.toFixed(2)}
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>Categoria que mais pesou</Text>
          {topCategoria ? (
            <View style={styles.categoriaRow}>
              <Text style={styles.categoriaNome}>{topCategoria.categoria}</Text>
              <Text style={styles.categoriaValor}>R$ {topCategoria.valor.toFixed(2)}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum gasto por categoria nesse mês.</Text>
          )}
        </GlassCard>

        <Button mode="contained" onPress={handleContinuar} loading={confirming} buttonColor={Colors.primary} style={styles.doneButton}>
          Continuar pro mês novo
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
  eyebrow: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginTop: 4, marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  card: { marginBottom: 16 },
  sectionLabel: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  bigNumber: { fontSize: 32, fontWeight: '800' },
  categoriaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoriaNome: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  categoriaValor: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  doneButton: { marginTop: 8, borderRadius: 12, paddingVertical: 4 },
});
