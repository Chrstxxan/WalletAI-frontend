import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Pressable } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton, TextInput, Chip } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getTransactions, deleteTransaction } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type TypeFilter = 'todas' | 'despesa' | 'receita';

type Transaction = {
  id: number;
  amount: number;
  type: string;
  description: string;
  date: string;
  category: { name: string };
  benefitWallet: { id: number; type: string } | null;
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

export default function TransactionsScreen() {
  const bottomPadding = useBottomPadding(130);
  const params = useLocalSearchParams<{ month?: string; year?: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todas');
  const [viewMonth, setViewMonth] = useState(params.month ? Number(params.month) : CURRENT_MONTH);
  const [viewYear, setViewYear] = useState(params.year ? Number(params.year) : CURRENT_YEAR);
  const router = useRouter();

  const isCurrentMonth = viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR;

  function goPrevMonth() {
    setViewMonth(m => (m === 1 ? 12 : m - 1));
    setViewYear(y => (viewMonth === 1 ? y - 1 : y));
  }
  function goNextMonth() {
    if (isCurrentMonth) return;
    setViewMonth(m => (m === 12 ? 1 : m + 1));
    setViewYear(y => (viewMonth === 12 ? y + 1 : y));
  }

  const isSearching = search.trim().length > 0;

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesType = typeFilter === 'todas' || t.type === typeFilter;
      const matchesQuery = !query || t.description.toLowerCase().includes(query) || t.category.name.toLowerCase().includes(query);
      if (!matchesType || !matchesQuery) return false;
      if (query) return true; // com busca ativa, procura em todos os meses, não só no selecionado
      const txDate = new Date(t.date);
      return txDate.getMonth() + 1 === viewMonth && txDate.getFullYear() === viewYear;
    });
  }, [transactions, search, typeFilter, viewMonth, viewYear]);

  async function loadTransactions() {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    loadTransactions();
  }

  function confirmDelete(id: number, description: string) {
    Alert.alert(
      'Excluir transação',
      `Tem certeza que deseja excluir "${description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  }

  async function handleDelete(id: number) {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a transação');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
        <Text variant="headlineLarge" style={styles.title}>Transações</Text>

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
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por descrição ou categoria..."
          mode="flat"
          style={styles.searchInput}
          underlineColor="transparent"
          textColor={Colors.textPrimary}
          left={<TextInput.Icon icon="magnify" color={Colors.textSecondary} />}
        />
        {isSearching && <Text style={styles.searchHint}>Buscando em todos os meses</Text>}

        <View style={styles.filterRow}>
          {(['todas', 'despesa', 'receita'] as TypeFilter[]).map((f) => (
            <Chip
              key={f}
              selected={typeFilter === f}
              onPress={() => setTypeFilter(f)}
              style={[styles.chip, typeFilter === f && styles.chipSelected]}
              textStyle={{ color: Colors.textPrimary, fontSize: 12 }}
            >
              {f === 'todas' ? 'Todas' : f === 'despesa' ? 'Despesas' : 'Receitas'}
            </Chip>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            data={filteredTransactions}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isSearching
                  ? 'Nenhuma transação encontrada.'
                  : isCurrentMonth
                    ? (transactions.length === 0 ? 'Nenhuma transação ainda. Adicione a primeira!' : 'Nenhuma transação encontrada.')
                    : 'Nenhuma transação nesse mês.'}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push({
                  pathname: '/add-transaction',
                  params: {
                    id: String(item.id),
                    amount: String(item.amount),
                    type: item.type,
                    description: item.description,
                    benefitWalletId: item.benefitWallet ? String(item.benefitWallet.id) : '',
                  },
                })}
              >
                <GlassCard style={styles.item}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemDescriptionRow}>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        {item.benefitWallet && (
                          <View style={styles.benefitTag}>
                            <Text style={styles.benefitTagText}>{item.benefitWallet.type}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemCategory}>
                        {item.category.name}
                        {isSearching ? ` · ${new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: item.type === 'receita' ? Colors.primaryLight : '#FF6B6B' }]}>
                      {item.type === 'receita' ? '+' : '-'} R$ {item.amount.toFixed(2)}
                    </Text>
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={Colors.textSecondary}
                      size={20}
                      onPress={() => confirmDelete(item.id, item.description)}
                    />
                  </View>
                </GlassCard>
              </Pressable>
            )}
          />
        )}

        {isCurrentMonth && (
          <Button mode="contained" onPress={() => router.push('/add-transaction')} style={styles.fab} buttonColor={Colors.primary}>
            + Nova transação
          </Button>
        )}
      </View>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 130 },
  list: { flex: 1 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  monthNavLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', minWidth: 140, textAlign: 'center' },
  searchInput: { backgroundColor: Colors.inputBackground, borderRadius: 12, marginBottom: 4 },
  searchHint: { color: Colors.textSecondary, fontSize: 11, fontStyle: 'italic', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: Colors.inputBackground },
  chipSelected: { backgroundColor: `${Colors.primary}33` },
  item: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDescriptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDescription: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  benefitTag: { backgroundColor: `${Colors.primary}33`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  benefitTagText: { color: Colors.primaryLight, fontSize: 10, fontWeight: '700' },
  itemCategory: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
  fab: { borderRadius: 12, marginTop: 12, paddingVertical: 4 },
});