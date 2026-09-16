import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton, TextInput, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { getBenefitWallets, createBenefitWallet, topUpBenefitWallet, deleteBenefitWallet } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/colors';

type Wallet = { id: number; type: string; balance: number; gastoNoMes: number };

const TIPOS = ['VR', 'VA', 'Combustível'];

export default function BenefitWalletsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<number | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [savingTopUp, setSavingTopUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    try {
      setWallets(await getBenefitWallets());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(type: string) {
    setCreatingType(type);
    try {
      await createBenefitWallet(type);
      await load();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível criar a carteira');
    } finally {
      setCreatingType(null);
    }
  }

  function startTopUp(id: number) {
    setTopUpId(id);
    setTopUpAmount('');
  }

  async function saveTopUp(id: number) {
    if (!topUpAmount.trim()) {
      Alert.alert('Erro', 'Preencha o valor');
      return;
    }
    setSavingTopUp(true);
    try {
      await topUpBenefitWallet(id, parseFloat(topUpAmount.replace(',', '.')) || 0);
      setTopUpId(null);
      await load();
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível adicionar saldo');
    } finally {
      setSavingTopUp(false);
    }
  }

  function confirmDelete(id: number, type: string) {
    Alert.alert('Excluir carteira', `Excluir a carteira ${type}? O histórico de transações não é apagado.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteBenefitWallet(id); await load(); } },
    ]);
  }

  const tiposFaltando = TIPOS.filter((t) => !wallets.some((w) => w.type === t));

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
      <BackButton />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text variant="headlineLarge" style={styles.title}>Benefícios de trabalho</Text>
        <Text style={styles.subtitle}>VR, VA e cartão combustível — a IA confere se a transação faz sentido pra cada tipo.</Text>

        {wallets.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma carteira cadastrada ainda.</Text>
        ) : (
          wallets.map((wallet) => {
            const totalDisponivel = wallet.balance + wallet.gastoNoMes;
            const progresso = totalDisponivel > 0 ? Math.min(wallet.gastoNoMes / totalDisponivel, 1) : 0;
            const percentualUsado = Math.round(progresso * 100);
            const estourado = totalDisponivel > 0 && wallet.balance <= 0;
            const alerta = !estourado && percentualUsado >= 80;
            return (
            <GlassCard key={wallet.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.walletType}>
                  {estourado ? '🚨 ' : alerta ? '⚠️ ' : ''}{wallet.type}
                </Text>
                <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDelete(wallet.id, wallet.type)} />
              </View>
              <Text style={styles.balanceLabel}>Saldo atual</Text>
              <Text style={[styles.balanceValue, { color: estourado ? '#FF6B6B' : Colors.primaryLight }]}>
                R$ {wallet.balance.toFixed(2)}
              </Text>
              <View style={styles.progressBlock}>
                <View style={styles.progressHeader}>
                  <Text style={styles.spentText}>Gasto este mês</Text>
                  <Text style={styles.spentText}>R$ {wallet.gastoNoMes.toFixed(2)} / R$ {totalDisponivel.toFixed(2)}</Text>
                </View>
                <ProgressBar
                  progress={progresso}
                  color={estourado ? '#FF6B6B' : alerta ? '#FFB74D' : Colors.primary}
                  style={styles.progressBar}
                />
              </View>

              {topUpId === wallet.id ? (
                <View style={styles.topUpBlock}>
                  <TextInput
                    label="Valor a adicionar (R$)"
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    keyboardType="decimal-pad"
                    mode="flat"
                    style={styles.topUpInput}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <View style={styles.topUpActions}>
                    <Button mode="text" onPress={() => setTopUpId(null)} textColor={Colors.textSecondary}>Cancelar</Button>
                    <Button mode="contained" onPress={() => saveTopUp(wallet.id)} loading={savingTopUp} buttonColor={Colors.primary}>Salvar</Button>
                  </View>
                </View>
              ) : (
                <Button mode="text" onPress={() => startTopUp(wallet.id)} textColor={Colors.primaryLight} style={styles.topUpButton}>
                  + Adicionar saldo
                </Button>
              )}
            </GlassCard>
            );
          })
        )}

        {tiposFaltando.length > 0 && (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Criar nova carteira</Text>
            {tiposFaltando.map((tipo) => (
              <Button
                key={tipo}
                mode="outlined"
                onPress={() => handleCreate(tipo)}
                loading={creatingType === tipo}
                textColor={Colors.primaryLight}
                style={styles.createButton}
              >
                + Criar carteira {tipo}
              </Button>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  title: { color: Colors.textPrimary, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 24, lineHeight: 18, textAlign: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletType: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  balanceLabel: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  balanceValue: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  spentText: { color: Colors.textSecondary, fontSize: 12 },
  progressBlock: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.inputBackground },
  topUpButton: { alignSelf: 'flex-start', marginTop: 8 },
  topUpBlock: { marginTop: 12 },
  topUpInput: { backgroundColor: Colors.inputBackground, marginBottom: 8, borderRadius: 12 },
  topUpActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  createButton: { borderRadius: 12, marginBottom: 8 },
});
