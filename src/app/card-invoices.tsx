import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getCardInvoices, deleteInvoiceItem } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

type InvoiceItem = { id: number; description: string; installmentAmount: number; currentInstallment: number; totalInstallments: number };
type Invoice = { id: number; month: number; year: number; total: number; items: InvoiceItem[] };

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function CardInvoicesScreen() {
  const { cardId, cardName } = useLocalSearchParams<{ cardId: string; cardName: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

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
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemMeta}>Parcela {item.currentInstallment}/{item.totalInstallments}</Text>
                  </View>
                  <Text style={styles.itemValue}>R$ {item.installmentAmount.toFixed(2)}</Text>
                  <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDelete(item.id, item.description)} />
                </View>
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
  title: { color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20 },
  card: { marginBottom: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 40 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  invoiceTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  invoiceTotal: { color: Colors.primaryLight, fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  itemDesc: { color: Colors.textPrimary, fontSize: 14 },
  itemMeta: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  itemValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginRight: 4 },
});