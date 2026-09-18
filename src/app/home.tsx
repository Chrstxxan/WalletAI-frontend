import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton, ProgressBar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { getDashboard, getMe, getMonthlyFixedExpenseRecords, getMonthlyIncomeRecords, getMonthSummary, getBenefitWallets } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { IsometricPieChart } from '@/components/IsometricPieChart';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Colors } from '@/constants/colors';
import { buildMonthlyReportHtml } from '@/utils/pdfReport';

type DashboardData = {
  profile: { savingsGoal: number } | null;
  monthlyIncome: number;
  totalDespesas: number;
  totalReceitas: number;
  totalFaturaCartoes: number;
  fixedExpenses: number;
  limiteLivre: number;
  disponivel: number;
  percentualUsado: number;
  alerta: boolean;
  gastosPorCategoria: { categoria: string; valor: number }[];
  orcamentosPorCategoria: { categoria: string; limite: number; gasto: number; percentualUsado: number; alerta: boolean; estourado: boolean }[];
};

const CATEGORY_COLORS = ['#0f6b47', '#1f8055', '#155e42', '#2f7a5c', '#0b4a33', '#3a4a44'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

// módulo (não componente) pra sobreviver a remounts da home ao navegar pela navbar —
// o alerta de revisão pendente deve aparecer só uma vez por sessão do app, não toda
// vez que a tela home é montada de novo.
let hasShownReviewReminderThisSession = false;

export default function HomeScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBarra, setSelectedBarra] = useState<{ label: string; valor: number; color: string } | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewDone, setReviewDone] = useState(0);
  const [benefitWallets, setBenefitWallets] = useState<{ id: number; type: string; balance: number; gastoNoMes: number }[]>([]);
  const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  const hasLoadedOnce = useRef(false);
  const router = useRouter();

  const isCurrentMonth = viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR;

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const isFirstLoadOfSession = !hasLoadedOnce.current;
        if (isFirstLoadOfSession) setLoading(true);
        try {
          if (isCurrentMonth) {
            const [dashboard, user, fixedExpenseRecords, incomeRecords, wallets] = await Promise.all([
              getDashboard(), getMe(), getMonthlyFixedExpenseRecords(), getMonthlyIncomeRecords(), getBenefitWallets(),
            ]);
            setData(dashboard);
            setUserName(user.name || '');
            setBenefitWallets(wallets);
            const total = fixedExpenseRecords.length + incomeRecords.length;
            const done =
              fixedExpenseRecords.filter((r: any) => r.isPaid).length +
              incomeRecords.filter((r: any) => r.isReceived).length;
            setReviewTotal(total);
            setReviewDone(done);

            if (isFirstLoadOfSession && !hasShownReviewReminderThisSession && total > 0 && done < total) {
              hasShownReviewReminderThisSession = true;
              Alert.alert(
                'Revisão do mês pendente',
                `Você ainda tem ${total - done} ${total - done === 1 ? 'item' : 'itens'} pra revisar em "${MESES[viewMonth - 1]}".`,
                [
                  { text: 'Depois', style: 'cancel' },
                  { text: 'Revisar agora', onPress: () => router.push('/monthly-review') },
                ]
              );
            }
          } else {
            const [summary, user] = await Promise.all([getMonthSummary(viewMonth, viewYear), getMe()]);
            setData(summary);
            setUserName(user.name || '');
            setReviewTotal(0);
            setReviewDone(0);
            setBenefitWallets([]);
          }
          setSelectedBarra(null);
        } catch (error: any) {
          if (error?.isAuthError) {
            // token válido mas usuário não existe mais (ex: banco resetado) — desloga em vez de travar a tela
            await SecureStore.deleteItemAsync('token');
            router.replace('/login');
            return;
          }
          Alert.alert('Erro de conexão', 'Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.');
        } finally {
          hasLoadedOnce.current = true;
          setLoading(false);
        }
      }
      load();
    }, [viewMonth, viewYear])
  );

  function goPrevMonth() {
    setViewMonth(m => (m === 1 ? 12 : m - 1));
    setViewYear(y => (viewMonth === 1 ? y - 1 : y));
  }
  function goNextMonth() {
    if (isCurrentMonth) return;
    setViewMonth(m => (m === 12 ? 1 : m + 1));
    setViewYear(y => (viewMonth === 12 ? y + 1 : y));
  }

  if (!data) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const estourado = data.percentualUsado >= 100;
  const usadoVisual = Math.min(data.percentualUsado, 100);
  const corUsado = estourado ? '#FF6B6B' : data.alerta ? '#E0A458' : Colors.primary;

  const gastosPorCategoria = data.gastosPorCategoria;
  const totalGastosCategoria = gastosPorCategoria.reduce((sum, item) => sum + item.valor, 0);
  const categoriaData = gastosPorCategoria.map((item, index) => ({
    label: item.categoria,
    value: item.valor,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const totalDespesasCompleto = data.totalDespesas + data.fixedExpenses + data.totalFaturaCartoes;
  const totalRecebidoCompleto = data.monthlyIncome + data.totalReceitas;
  const saldoMes = totalRecebidoCompleto - totalDespesasCompleto;

  async function handleExportPdf() {
    if (!data) return;
    setExportingPdf(true);
    try {
      const html = buildMonthlyReportHtml({
        userName,
        month: viewMonth,
        year: viewYear,
        recebido: totalRecebidoCompleto,
        gasto: totalDespesasCompleto,
        saldo: saldoMes,
        categorias: gastosPorCategoria,
        orcamentos: isCurrentMonth ? data.orcamentosPorCategoria : [],
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório WalletAI' });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em:\n${uri}`);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o PDF do relatório');
    } finally {
      setExportingPdf(false);
    }
  }

  const barData = [
    {
      value: totalRecebidoCompleto,
      label: 'Receitas',
      frontColor: Colors.primaryLight,
      topLabelComponent: () => <Text style={styles.barTopLabel}>R$ {totalRecebidoCompleto.toFixed(0)}</Text>,
      onPress: () => setSelectedBarra({ label: 'Receitas', valor: totalRecebidoCompleto, color: Colors.primaryLight }),
    },
    {
      value: totalDespesasCompleto,
      label: 'Despesas',
      frontColor: '#FF6B6B',
      topLabelComponent: () => <Text style={styles.barTopLabel}>R$ {totalDespesasCompleto.toFixed(0)}</Text>,
      onPress: () => setSelectedBarra({ label: 'Despesas', valor: totalDespesasCompleto, color: '#FF6B6B' }),
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          Bem-vindo(a){userName ? `, ${userName}` : ''}!
        </Text>

        <View style={styles.monthNav}>
          <IconButton icon="chevron-left" iconColor={Colors.textPrimary} size={22} onPress={goPrevMonth} />
          <Text style={styles.monthNavLabel}>{MESES[viewMonth - 1]} {viewYear}</Text>
          <IconButton
            icon="chevron-right"
            iconColor={isCurrentMonth ? Colors.textSecondary : Colors.textPrimary}
            size={22}
            onPress={goNextMonth}
            disabled={isCurrentMonth}
          />
          {loading && <ActivityIndicator color={Colors.textSecondary} size={16} style={styles.monthNavSpinner} />}
        </View>

        {isCurrentMonth ? (
          <>
            {estourado && (
              <GlassCard style={[styles.card, styles.alertCard]}>
                <Text style={styles.alertTitle}>🚨 Limite mensal estourado</Text>
                <Text style={styles.alertBody}>
                  Você já ultrapassou o limite livre em R$ {Math.abs(data.disponivel).toFixed(2)}. Reveja os gastos do mês.
                </Text>
              </GlassCard>
            )}
            {!estourado && data.alerta && (
              <GlassCard style={[styles.card, styles.warnCard]}>
                <Text style={styles.warnTitle}>⚠️ Perto do limite</Text>
                <Text style={styles.warnBody}>Você já usou {data.percentualUsado}% do seu limite livre este mês.</Text>
              </GlassCard>
            )}

            <GlassCard style={styles.card}>
              <Text style={[styles.label, styles.centerText]}>Disponível para gastar este mês</Text>
              <Text style={[styles.bigNumber, styles.centerText, { color: estourado ? '#FF6B6B' : Colors.primaryLight }]}>
                R$ {data.disponivel.toFixed(2)}
              </Text>

              <View style={styles.usadoRow}>
                <View style={styles.orcamentoHeader}>
                  <Text style={styles.orcamentoNome}>
                    {estourado ? '🚨 ' : data.alerta ? '⚠️ ' : ''}Usado no mês
                  </Text>
                  <Text style={styles.orcamentoValores}>{data.percentualUsado}%</Text>
                </View>
                <ProgressBar progress={usadoVisual / 100} color={corUsado} style={styles.progressBar} />
              </View>
            </GlassCard>
          </>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.label}>Recebido</Text>
                <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>R$ {totalRecebidoCompleto.toFixed(2)}</Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={styles.label}>Gasto</Text>
                <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>R$ {totalDespesasCompleto.toFixed(2)}</Text>
              </GlassCard>
            </View>

            <GlassCard style={styles.card}>
              <Text style={styles.label}>Saldo do mês</Text>
              <Text style={[styles.bigNumber, { color: saldoMes >= 0 ? Colors.primaryLight : '#FF6B6B' }]}>
                R$ {saldoMes.toFixed(2)}
              </Text>
            </GlassCard>
          </>
        )}

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Gastos por categoria</Text>
          {categoriaData.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum gasto registrado este mês</Text>
          ) : (
            <>
              <View style={[styles.chartWrapper, styles.categoriaChartWrapper]}>
                <IsometricPieChart data={categoriaData} width={260} />
              </View>
              <View style={styles.legendWrap}>
                {gastosPorCategoria.map((item, index) => {
                  const pct = totalGastosCategoria > 0 ? Math.round((item.valor / totalGastosCategoria) * 100) : 0;
                  return (
                    <View key={item.categoria} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]} />
                      <Text style={styles.legendLabel}>{item.categoria}</Text>
                      <Text style={styles.legendValue}>{pct}% · R$ {item.valor.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
          {isCurrentMonth && benefitWallets.length > 0 && (
            <Text style={styles.chartCaption}>
              Não inclui gastos pagos com carteira de benefício (VR/VA/Combustível) — veja o card "Benefícios de trabalho" abaixo.
            </Text>
          )}
        </GlassCard>

        {isCurrentMonth && data.orcamentosPorCategoria.length > 0 && (
          <Pressable onPress={() => router.push('/category-budgets')}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>Orçamento por categoria</Text>
              {data.orcamentosPorCategoria.map((orc) => (
                <View key={orc.categoria} style={styles.orcamentoRow}>
                  <View style={styles.orcamentoHeader}>
                    <Text style={styles.orcamentoNome}>
                      {orc.estourado ? '🚨 ' : orc.alerta ? '⚠️ ' : ''}{orc.categoria}
                    </Text>
                    <Text style={styles.orcamentoValores}>R$ {orc.gasto.toFixed(2)} / R$ {orc.limite.toFixed(2)}</Text>
                  </View>
                  <ProgressBar
                    progress={Math.min(orc.gasto / orc.limite, 1)}
                    color={orc.estourado ? '#FF6B6B' : orc.alerta ? '#FFB74D' : Colors.primary}
                    style={styles.progressBar}
                  />
                </View>
              ))}
              <Text style={styles.reviewHint}>Toque para ajustar os limites</Text>
            </GlassCard>
          </Pressable>
        )}

        {isCurrentMonth && benefitWallets.length > 0 && (
          <Pressable onPress={() => router.push('/benefit-wallets')}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>Benefícios de trabalho</Text>
              {benefitWallets.map((wallet) => {
                const totalDisponivel = wallet.balance + wallet.gastoNoMes;
                const progresso = totalDisponivel > 0 ? Math.min(wallet.gastoNoMes / totalDisponivel, 1) : 0;
                const percentualUsado = Math.round(progresso * 100);
                const estourado = totalDisponivel > 0 && wallet.balance <= 0;
                const alerta = !estourado && percentualUsado >= 80;
                return (
                  <View key={wallet.id} style={styles.orcamentoRow}>
                    <View style={styles.orcamentoHeader}>
                      <Text style={styles.orcamentoNome}>
                        {estourado ? '🚨 ' : alerta ? '⚠️ ' : ''}{wallet.type}
                      </Text>
                      <Text style={styles.orcamentoValores}>R$ {wallet.gastoNoMes.toFixed(2)} / R$ {totalDisponivel.toFixed(2)}</Text>
                    </View>
                    <ProgressBar
                      progress={progresso}
                      color={estourado ? '#FF6B6B' : alerta ? '#FFB74D' : Colors.primary}
                      style={styles.progressBar}
                    />
                  </View>
                );
              })}
              <Text style={styles.reviewHint}>Toque para ver detalhes e adicionar saldo</Text>
            </GlassCard>
          </Pressable>
        )}

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Receitas x Despesas</Text>
          <View style={[styles.chartWrapper, styles.barChartWrapper]}>
            <BarChart
              data={barData}
              barWidth={44}
              spacing={44}
              roundedTop
              hideRules
              xAxisColor={Colors.glassBorder}
              yAxisColor={Colors.glassBorder}
              xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'center' }}
              yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
              noOfSections={4}
              disablePress={false}
              overflowTop={36}
            />
          </View>
          <View style={styles.selectedInfo}>
            {selectedBarra ? (
              <View style={[styles.selectedChip, { backgroundColor: `${selectedBarra.color}22` }]}>
                <Text style={styles.selectedText}>{selectedBarra.label}</Text>
                <Text style={styles.selectedValue}>R$ {selectedBarra.valor.toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={styles.tapHint}>Toque em uma barra para ver o valor exato</Text>
            )}
          </View>
          {isCurrentMonth && !!data.profile?.savingsGoal && (
            <Text style={styles.chartCaption}>
              A diferença entre receitas e despesas aqui não desconta sua meta de economia (R$ {data.profile.savingsGoal.toFixed(2)}) — ela já está reservada no "Disponível para gastar" acima.
            </Text>
          )}
          {isCurrentMonth && benefitWallets.length > 0 && (
            <Text style={styles.chartCaption}>
              Também não inclui gastos pagos com carteira de benefício (VR/VA/Combustível).
            </Text>
          )}
        </GlassCard>

        {reviewTotal > 0 && (
          <Pressable onPress={() => router.push('/monthly-review')}>
            <GlassCard style={styles.card}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionTitle}>Revisão do mês</Text>
                <Text style={styles.reviewCount}>{reviewDone} de {reviewTotal}</Text>
              </View>
              <ProgressBar progress={reviewDone / reviewTotal} color={Colors.primary} style={styles.progressBar} />
              <Text style={styles.reviewHint}>Toque para marcar contas pagas e renda recebida</Text>
            </GlassCard>
          </Pressable>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="format-list-bulleted"
            onPress={() => router.push({ pathname: '/transactions', params: { month: String(viewMonth), year: String(viewYear) } })}
            buttonColor={Colors.primary}
            style={styles.primaryAction}
          >
            Ver transações
          </Button>
          <Button
            mode="outlined"
            icon="file-pdf-box"
            onPress={handleExportPdf}
            loading={exportingPdf}
            textColor={Colors.primaryLight}
            style={styles.secondaryAction}
          >
            Exportar relatório em PDF
          </Button>
          <View style={styles.moreLinksRow}>
            <Pressable onPress={() => router.push('/financial-profile')}>
              <Text style={styles.moreLink}>Meus dados financeiros</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/category-budgets')}>
              <Text style={styles.moreLink}>Orçamento por categoria</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/benefit-wallets')}>
              <Text style={styles.moreLink}>Benefícios de trabalho</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 130 },
  title: { color: Colors.textPrimary, fontWeight: '700', fontSize: 24, marginBottom: 20, textAlign: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  monthNavLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', minWidth: 140, textAlign: 'center' },
  monthNavSpinner: { marginLeft: 4 },
  card: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  alertCard: { backgroundColor: 'rgba(255,107,107,0.12)' },
  alertTitle: { color: '#FF6B6B', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  alertBody: { color: Colors.textPrimary, fontSize: 13 },
  warnCard: { backgroundColor: 'rgba(255,183,77,0.12)' },
  warnTitle: { color: '#FFB74D', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  warnBody: { color: Colors.textPrimary, fontSize: 13 },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  bigNumber: { fontSize: 32, fontWeight: '800', marginBottom: 12 },
  chartWrapper: { width: '100%', alignItems: 'center', marginTop: 8 },
  categoriaChartWrapper: { marginTop: 16, marginBottom: 8 },
  barChartWrapper: { marginTop: 24 },
  barTopLabel: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  selectedInfo: { marginTop: 16, minHeight: 40, justifyContent: 'center', alignItems: 'center', width: '100%' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
  selectedText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  selectedValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  tapHint: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  chartCaption: { color: Colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewCount: { color: Colors.primaryLight, fontSize: 16, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.inputBackground },
  reviewHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 10 },
  orcamentoRow: { marginBottom: 12 },
  usadoRow: { marginTop: 16 },
  orcamentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orcamentoNome: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  orcamentoValores: { color: Colors.textSecondary, fontSize: 12 },
  actions: { marginTop: 8 },
  primaryAction: { borderRadius: 14, paddingVertical: 4 },
  secondaryAction: { borderRadius: 14, marginTop: 12 },
  moreLinksRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 20 },
  moreLink: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  legendWrap: { marginTop: 20, width: '100%', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 },
  legendValue: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
});