import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getCategoryBudgets, updateCategoryBudgets } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type BudgetRow = { categoria: string; limite: string; gasto: number; percentualUsado: number };

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const now = new Date();
const MES_ATUAL_LABEL = `${MESES[now.getMonth()]} de ${now.getFullYear()}`;

export default function CategoryBudgetsScreen() {
  const bottomPadding = useBottomPadding(40);
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategoryBudgets();
        setRows(data.map((b: any) => ({
          categoria: b.categoria,
          limite: b.limite ? String(b.limite) : '',
          gasto: b.gasto,
          percentualUsado: b.percentualUsado,
        })));
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  function updateLimite(index: number, value: string) {
    const updated = [...rows];
    updated[index].limite = value;
    setRows(updated);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const budgets = rows
        .filter(r => r.limite.trim())
        .map(r => ({ categoria: r.categoria, limite: parseFloat(r.limite.replace(',', '.')) || 0 }));
      await updateCategoryBudgets(budgets);
      Alert.alert('Sucesso', 'Orçamentos atualizados!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar os orçamentos');
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

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Orçamento por categoria</Text>
        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>Sempre reflete {MES_ATUAL_LABEL} (mês atual)</Text>
        </View>
        <Text variant="bodyMedium" style={styles.subtitle}>Defina um limite mensal pra cada categoria e receba um alerta ao se aproximar dele</Text>

        <GlassCard style={styles.card}>
          {rows.map((row, index) => {
            const limiteNum = parseFloat(row.limite.replace(',', '.')) || 0;
            const progresso = limiteNum > 0 ? Math.min(row.gasto / limiteNum, 1) : 0;
            const estourado = limiteNum > 0 && row.gasto > limiteNum;

            return (
              <View key={row.categoria} style={styles.rowBlock}>
                <View style={styles.rowHeader}>
                  <Text style={styles.categoriaNome}>{row.categoria}</Text>
                  <Text style={styles.gastoAtual}>gasto em {MESES[now.getMonth()]}: R$ {row.gasto.toFixed(2)}</Text>
                </View>
                <TextInput
                  label="Limite mensal (R$)"
                  value={row.limite}
                  onChangeText={(v) => updateLimite(index, v)}
                  keyboardType="decimal-pad"
                  placeholder="Sem limite definido"
                  mode="flat"
                  style={styles.input}
                  underlineColor="transparent"
                  textColor={Colors.textPrimary}
                />
                {limiteNum > 0 && (
                  <ProgressBar
                    progress={progresso}
                    color={estourado ? '#FF6B6B' : row.percentualUsado >= 80 ? '#FFB74D' : Colors.primary}
                    style={styles.progressBar}
                  />
                )}
              </View>
            );
          })}
        </GlassCard>

        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button} buttonColor={Colors.primary}>
          Salvar
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
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  monthBadge: { alignSelf: 'center', backgroundColor: Colors.glassTint, borderWidth: 1, borderColor: Colors.glassBorder, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginTop: 12 },
  monthBadgeText: { color: Colors.primaryLight, fontSize: 12, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginTop: 12, marginBottom: 24 },
  card: { marginTop: 8, marginBottom: 16 },
  rowBlock: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoriaNome: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  gastoAtual: { color: Colors.textSecondary, fontSize: 12 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 8, borderRadius: 12 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.inputBackground },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});
