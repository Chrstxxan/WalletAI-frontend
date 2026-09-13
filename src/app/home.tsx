import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { getDashboard } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

type DashboardData = {
  totalDespesas: number;
  totalReceitas: number;
  limiteLivre: number;
  disponivel: number;
  percentualUsado: number;
  alerta: boolean;
  gastosPorCategoria: { categoria: string; valor: number }[];
};

const CATEGORY_COLORS = ['#1f8055', '#2ea86f', '#5fd99a', '#a8e6c9', '#e0e0e0', '#7a7a7a'];
const DONUT_INNER_COLOR = 'rgba(0,0,0,0.35)';

export default function HomeScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const dashboard = await getDashboard();
          setData(dashboard);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }

  if (loading || !data) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  const estourado = data.percentualUsado >= 100;
  const usadoVisual = Math.min(data.percentualUsado, 100);
  const corUsado = estourado ? '#FF6B6B' : data.alerta ? '#FFB74D' : Colors.primary;

  const gaugeData = [
    { value: usadoVisual, color: corUsado },
    { value: 100 - usadoVisual, color: 'rgba(255,255,255,0.08)' },
  ];

  const categoriaData = data.gastosPorCategoria.map((item, index) => ({
    value: item.valor,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    text: item.categoria,
  }));

  const barData = [
    { value: data.totalReceitas, label: 'Receitas', frontColor: Colors.primaryLight },
    { value: data.totalDespesas, label: 'Despesas', frontColor: '#FF6B6B' },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Olá! 👋</Text>

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
          <Text style={styles.label}>Disponível para gastar este mês</Text>
          <Text style={[styles.bigNumber, { color: estourado ? '#FF6B6B' : Colors.primaryLight }]}>
            R$ {data.disponivel.toFixed(2)}
          </Text>

          <View style={styles.gaugeWrapper}>
            <PieChart
              data={gaugeData}
              donut
              radius={70}
              innerRadius={54}
              backgroundColor="transparent"
              innerCircleColor={DONUT_INNER_COLOR}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }}>
                    {data.percentualUsado}%
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 11 }}>usado</Text>
                </View>
              )}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Gastos por categoria</Text>
          {categoriaData.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum gasto registrado este mês</Text>
          ) : (
            <>
              <PieChart
                data={categoriaData}
                donut
                radius={70}
                innerRadius={44}
                backgroundColor="transparent"
                innerCircleColor={DONUT_INNER_COLOR}
              />
              <View style={styles.legendList}>
                {categoriaData.map((item) => (
                  <View key={item.text} style={[styles.legendRow, { backgroundColor: `${item.color}1A` }]}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.text}</Text>
                    <Text style={styles.legendValue}>R$ {item.value.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Receitas x Despesas</Text>
          <BarChart
            data={barData}
            barWidth={40}
            spacing={40}
            roundedTop
            hideRules
            xAxisColor={Colors.glassBorder}
            yAxisColor={Colors.glassBorder}
            xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 12 }}
            yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
            noOfSections={4}
          />
        </GlassCard>

        <View style={styles.actions}>
          <Button mode="contained" onPress={() => router.push('/transactions')} buttonColor={Colors.primary} style={styles.button}>
            Ver transações
          </Button>
          <Button mode="outlined" onPress={() => router.push('/financial-profile')} textColor={Colors.primaryLight} style={styles.button}>
            Meus dados financeiros
          </Button>
          <Button mode="text" onPress={handleLogout} textColor={Colors.textSecondary} style={styles.button}>
            Sair
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 20 },
  card: { marginBottom: 16, alignItems: 'center' },
  alertCard: { backgroundColor: 'rgba(255,107,107,0.12)', alignItems: 'flex-start' },
  alertTitle: { color: '#FF6B6B', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  alertBody: { color: Colors.textPrimary, fontSize: 13 },
  warnCard: { backgroundColor: 'rgba(255,183,77,0.12)', alignItems: 'flex-start' },
  warnTitle: { color: '#FFB74D', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  warnBody: { color: Colors.textPrimary, fontSize: 13 },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4, alignSelf: 'flex-start' },
  bigNumber: { fontSize: 32, fontWeight: '800', marginBottom: 12, alignSelf: 'flex-start' },
  gaugeWrapper: { marginTop: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16, alignSelf: 'flex-start' },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  legendList: { width: '100%', marginTop: 20, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText: { color: Colors.textPrimary, fontSize: 14, flex: 1, fontWeight: '500' },
  legendValue: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  actions: { gap: 10, marginTop: 8 },
  button: { borderRadius: 12 },
});