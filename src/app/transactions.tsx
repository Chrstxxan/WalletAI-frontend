import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { getTransactions } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

type Transaction = {
  id: number;
  amount: number;
  type: string;
  description: string;
  date: string;
  category: { name: string };
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function loadTransactions() {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarrega a lista toda vez que a tela ganha foco (ex: ao voltar de "Adicionar")
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadTransactions();
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <View style={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Transações</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma transação ainda. Adicione a primeira!</Text>
            }
            renderItem={({ item }) => (
              <GlassCard style={styles.item}>
                <View style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={styles.itemCategory}>{item.category.name}</Text>
                  </View>
                  <Text style={[styles.itemAmount, { color: item.type === 'receita' ? Colors.primaryLight : '#FF6B6B' }]}>
                    {item.type === 'receita' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                  </Text>
                </View>
              </GlassCard>
            )}
          />
        )}

        <Button mode="contained" onPress={() => router.push('/add-transaction')} style={styles.fab} buttonColor={Colors.primary}>
          + Nova transação
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 20 },
  item: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDescription: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  itemCategory: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: { borderRadius: 12, marginTop: 12, paddingVertical: 4 },
});