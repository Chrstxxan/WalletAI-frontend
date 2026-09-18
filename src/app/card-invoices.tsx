import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, ActivityIndicator, IconButton, TextInput, Button } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getCardInvoices, deleteInvoiceItem, updateInvoiceItem } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type InvoiceItem = { id: number; description: string; installmentAmount: number; currentInstallment: number; totalInstallments: number };
type Invoice = { id: number; month: number; year: number; total: number; items: InvoiceItem[] };

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function CardInvoicesScreen() {
  const bottomPadding = useBottomPadding(40);
  const { cardId, cardName } = useLocalSearchParams<{ cardId: string; cardName: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrent, setEditCurrent] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          setInvoices(await getCardInvoices(Number(cardId)));
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [cardId])
  );

  async function refresh() {
    setInvoices(await getCardInvoices(Number(cardId)));
  }

  function confirmDelete(id: number, description: string) {
    Alert.alert('Excluir item', `Excluir "${description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteInvoiceItem(id); refresh(); } },
    ]);
  }

  function startEdit(item: InvoiceItem) {
    setEditingId(item.id);
    setEditDescription(item.description);
    setEditAmount(String(item.installmentAmount));
    setEditCurrent(String(item.currentInstallment));
    setEditTotal(String(item.totalInstallments));
  }

  async function saveEdit(id: number) {
    if (!editDescription.trim() || !editAmount.trim()) {
      Alert.alert('Erro', 'Preencha a descrição e o valor');
      return;
    }
    setSavingEdit(true);
    try {
      await updateInvoiceItem(id, {
        description: editDescription.trim(),
        installmentAmount: parseFloat(editAmount.replace(',', '.')) || 0,
        currentInstallment: parseInt(editCurrent, 10) || 1,
        totalInstallments: parseInt(editTotal, 10) || 1,
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
        <Text variant="headlineLarge" style={styles.title}>{cardName}</Text>
        <Text style={styles.subtitle}>Todas as faturas lançadas</Text>

        {invoices.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma fatura lançada ainda para este cartão.</Text>
        ) : (
          invoices.map((invoice) => (
            <GlassCard key={invoice.id} style={styles.card}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceTitle}>{MESES[invoice.month - 1]}/{invoice.year}</Text>
                <Text style={styles.invoiceTotal}>R$ {invoice.total.toFixed(2)}</Text>
              </View>
              {invoice.items.map((item) => (
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
                    <View style={styles.editRow}>
                      <TextInput
                        label="Parcela atual"
                        value={editCurrent}
                        onChangeText={setEditCurrent}
                        keyboardType="number-pad"
                        mode="flat"
                        style={[styles.editInput, styles.editInputHalf]}
                        underlineColor="transparent"
                        textColor={Colors.textPrimary}
                      />
                      <TextInput
                        label="Total de parcelas"
                        value={editTotal}
                        onChangeText={setEditTotal}
                        keyboardType="number-pad"
                        mode="flat"
                        style={[styles.editInput, styles.editInputHalf]}
                        underlineColor="transparent"
                        textColor={Colors.textPrimary}
                      />
                    </View>
                    <View style={styles.editActions}>
                      <Button mode="text" onPress={() => setEditingId(null)} textColor={Colors.textSecondary}>Cancelar</Button>
                      <Button mode="contained" onPress={() => saveEdit(item.id)} loading={savingEdit} buttonColor={Colors.primary}>Salvar</Button>
                    </View>
                  </View>
                ) : (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                      <Text style={styles.itemMeta}>Parcela {item.currentInstallment}/{item.totalInstallments}</Text>
                    </View>
                    <Text style={styles.itemValue}>R$ {item.installmentAmount.toFixed(2)}</Text>
                    <IconButton icon="pencil-outline" iconColor={Colors.textSecondary} size={18} onPress={() => startEdit(item)} />
                    <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDelete(item.id, item.description)} />
                  </View>
                )
              ))}
            </GlassCard>
          ))
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
  title: { color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20, textAlign: 'center' },
  card: { marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 40 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  invoiceTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  invoiceTotal: { color: Colors.primaryLight, fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  itemDesc: { color: Colors.textPrimary, fontSize: 14 },
  itemMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  itemValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginRight: 4 },
  editBlock: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  editInput: { backgroundColor: Colors.inputBackground, marginBottom: 8, borderRadius: 12 },
  editRow: { flexDirection: 'row', gap: 8 },
  editInputHalf: { flex: 1 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});