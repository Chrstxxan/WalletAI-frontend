import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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

  const maiorCategoria = data?.gastosPorCategoria.length
    ? Math.max(...data.gastosPorCategoria.map(c => c.valor))
    : 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Olá! 👋</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <GlassCard style={styles.card}>
              <Text style={styles.label}>Disponível para gastar este mês</Text>
              <Text style={[styles.bigNumber, { color: data && data.disponivel < 0 ? '#FF6B6B' : Colors.primaryLight }]}>
                R$ {data?.disponivel.toFixed(2)}
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(data?.percentualUsado ?? 0, 100)}%`,
                      backgroundColor: data?.alerta ? '#FF6B6B' : Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>{data?.percentualUsado}% do limite livre usado</Text>

              {data?.alerta && (
                <Text style={styles.alertText}>⚠️ Você está perto de estourar seu limite mensal!</Text>
              )}
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>Gastos por categoria</Text>
              {data?.gastosPorCategoria.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum gasto registrado este mês</Text>
              ) : (
                data?.gastosPorCategoria.map((item) => (
                  <View key={item.categoria} style={styles.categoryRow}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{item.categoria}</Text>
                      <Text style={styles.categoryValue}>R$ {item.valor.toFixed(2)}</Text>
                    </View>
                    <View style={styles.categoryTrack}>
                      <View
                        style={[
                          styles.categoryFill,
                          { width: `${maiorCategoria > 0 ? (item.valor / maiorCategoria) * 100 : 0}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
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
          </>
        )}
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
  card: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  bigNumber: { fontSize: 32, fontWeight: '800', marginBottom: 16 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 6 },
  alertText: { color: '#FF6B6B', fontSize: 13, marginTop: 12, fontWeight: '600' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  categoryRow: { marginBottom: 12 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { color: Colors.textPrimary, fontSize: 14 },
  categoryValue: { color: Colors.textSecondary, fontSize: 14 },
  categoryTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  actions: { gap: 10, marginTop: 8 },
  button: { borderRadius: 12 },
});