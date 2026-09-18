import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton, TextInput } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCreditCards, getCreditCardSummary, deleteCreditCard, deleteInvoiceItem, updateInvoiceItem } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type Card = { id: number; name: string; limit: number; totalFaturaAtual: number; percentualDoLimite: number };
type Summary = {
  totalFaturaMes: number;
  percentualDaRenda: number;
  itensDoMes: { id: number; cartao: string; descricao: string; valorParcela: number; parcelaAtual: number; totalParcelas: number; parcelasRestantes: number }[];
};

export default function CreditCardsScreen() {
  const bottomPadding = useBottomPadding(130);
  const [cards, setCards] = useState<Card[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const [cardsData, summaryData] = await Promise.all([getCreditCards(), getCreditCardSummary()]);
          setCards(cardsData);
          setSummary(summaryData);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  async function refresh() {
    setCards(await getCreditCards());
    setSummary(await getCreditCardSummary());
  }

  function confirmDeleteCard(id: number, name: string) {
    Alert.alert('Excluir cartão', `Excluir "${name}" e todas as faturas dele?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteCreditCard(id); refresh(); } },
    ]);
  }

  function confirmDeleteItem(id: number, descricao: string) {
    Alert.alert('Excluir item', `Excluir "${descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteInvoiceItem(id); refresh(); } },
    ]);
  }

  function startEditItem(item: Summary['itensDoMes'][number]) {
    setEditingId(item.id);
    setEditDescription(item.descricao);
    setEditAmount(String(item.valorParcela));
  }

  async function saveEditItem(id: number, parcelaAtual: number, totalParcelas: number) {
    if (!editDescription.trim() || !editAmount.trim()) {
      Alert.alert('Erro', 'Preencha a descrição e o valor');
      return;
    }
    setSavingEdit(true);
    try {
      await updateInvoiceItem(id, {
        description: editDescription.trim(),
        installmentAmount: parseFloat(editAmount.replace(',', '.')) || 0,
        currentInstallment: parcelaAtual,
        totalInstallments: totalParcelas,
      });
      setEditingId(null);
      await refresh();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Cartões de crédito</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Fatura total deste mês</Text>
          <Text style={styles.bigNumber}>R$ {summary?.totalFaturaMes.toFixed(2)}</Text>
          <Text style={styles.percentText}>{summary?.percentualDaRenda}% da sua renda mensal</Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Meus cartões</Text>
          {cards.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum cartão cadastrado ainda.</Text>
          ) : (
            cards.map((card) => {
              const estourado = card.percentualDoLimite >= 100;
              const perto = card.percentualDoLimite >= 80;
              const cor = estourado ? '#FF6B6B' : perto ? '#FFB74D' : Colors.primary;
              return (
                <View key={card.id} style={styles.cardRow}>
                  <View style={styles.cardRowHeader}>
                    <Text style={styles.cardName}>{card.name}</Text>
                    <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDeleteCard(card.id, card.name)} />
                  </View>
                  <Text style={styles.cardUsage}>
                    R$ {card.totalFaturaAtual.toFixed(2)} de R$ {card.limit.toFixed(2)} ({card.percentualDoLimite}%)
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(card.percentualDoLimite, 100)}%`, backgroundColor: cor }]} />
                  </View>
                  {estourado && <Text style={styles.alertText}>🚨 Limite estourado</Text>}
                  {!estourado && perto && <Text style={styles.warnText}>⚠️ Perto do limite</Text>}
                  <Button
                    mode="text"
                    onPress={() => router.push({ pathname: '/card-invoices', params: { cardId: String(card.id), cardName: card.name } })}
                    textColor={Colors.primaryLight}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    Ver todas as faturas
                  </Button>
                </View>
              );
            })
          )}
          <Button mode="text" onPress={() => router.push('/add-credit-card')} textColor={Colors.primaryLight} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            + Adicionar cartão
          </Button>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Itens da fatura deste mês</Text>
          {!summary || summary.itensDoMes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum item lançado este mês.</Text>
          ) : (
            summary.itensDoMes.map((item) => (
              editingId === item.id ? (
                <View key={item.id} style={styles.editBlock}>
                  <TextInput
                    label="Descrição"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    mode="flat"
                    style={styles.editInput}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <TextInput
                    label="Valor da parcela (R$)"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="decimal-pad"
                    mode="flat"
                    style={styles.editInput}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <View style={styles.editActions}>
                    <Button mode="text" onPress={() => setEditingId(null)} textColor={Colors.textSecondary}>Cancelar</Button>
                    <Button
                      mode="contained"
                      onPress={() => saveEditItem(item.id, item.parcelaAtual, item.totalParcelas)}
                      loading={savingEdit}
                      buttonColor={Colors.primary}
                    >
                      Salvar
                    </Button>
                  </View>
                </View>
              ) : (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.descricao}</Text>
                    <Text style={styles.itemMeta}>
                      {item.cartao} · Parcela {item.parcelaAtual}/{item.totalParcelas}
                      {item.parcelasRestantes > 0 ? ` · Faltam ${item.parcelasRestantes}` : ' · Última parcela'}
                    </Text>
                  </View>
                  <Text style={styles.itemValue}>R$ {item.valorParcela.toFixed(2)}</Text>
                  <IconButton icon="pencil-outline" iconColor={Colors.textSecondary} size={18} onPress={() => startEditItem(item)} />
                  <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDeleteItem(item.id, item.descricao)} />
                </View>
              )
            ))
          )}
        </GlassCard>

        <Button mode="contained" onPress={() => router.push('/add-invoice-item')} buttonColor={Colors.primary} style={styles.fab} disabled={cards.length === 0}>
          + Lançar item na fatura
        </Button>
        {cards.length === 0 && (
          <Text style={styles.hintText}>Cadastre um cartão primeiro para poder lançar itens.</Text>
        )}
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
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  card: { marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  bigNumber: { color: Colors.primaryLight, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  percentText: { color: Colors.textSecondary, fontSize: 13 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  cardRow: { marginBottom: 16 },
  cardRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  cardUsage: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  alertText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600', marginTop: 4 },
  warnText: { color: '#FFB74D', fontSize: 12, fontWeight: '600', marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  itemDesc: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  itemMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  itemValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginRight: 4 },
  editBlock: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.glassBorder },
  editInput: { backgroundColor: Colors.inputBackground, marginBottom: 8, borderRadius: 12 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  fab: { borderRadius: 12, marginTop: 8 },
  hintText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 },
});