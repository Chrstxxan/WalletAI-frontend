import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, IconButton, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Colors } from '@/constants/colors';
import { useBottomPadding } from '@/utils/useBottomPadding';

type Goal = {
  id: number;
  description: string;
  targetAmount: number;
  currentAmount: number;
  percentualUsado: number;
  concluida: boolean;
};

export default function GoalsScreen() {
  const bottomPadding = useBottomPadding(130);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDescription, setNewDescription] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [creating, setCreating] = useState(false);
  const [contributions, setContributions] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTarget, setEditTarget] = useState('');

  async function load() {
    try {
      const data = await getGoals();
      setGoals(data);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleCreate() {
    if (!newDescription.trim() || !newTarget.trim()) {
      Alert.alert('Erro', 'Preencha a descrição e o valor da meta');
      return;
    }
    setCreating(true);
    try {
      await createGoal(newDescription.trim(), parseFloat(newTarget.replace(',', '.')) || 0);
      setNewDescription('');
      setNewTarget('');
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a meta');
    } finally {
      setCreating(false);
    }
  }

  async function handleContribute(goal: Goal) {
    const valor = parseFloat((contributions[goal.id] || '').replace(',', '.')) || 0;
    if (valor === 0) return;
    try {
      const updated = await updateGoal(goal.id, { currentAmount: goal.currentAmount + valor });
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      setContributions(prev => ({ ...prev, [goal.id]: '' }));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o progresso');
    }
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditDescription(goal.description);
    setEditTarget(String(goal.targetAmount));
  }

  async function saveEdit(goal: Goal) {
    try {
      const updated = await updateGoal(goal.id, {
        description: editDescription.trim() || goal.description,
        targetAmount: parseFloat(editTarget.replace(',', '.')) || goal.targetAmount,
      });
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      setEditingId(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a edição');
    }
  }

  function confirmDelete(goal: Goal) {
    Alert.alert('Excluir meta', `Tem certeza que deseja excluir "${goal.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          await deleteGoal(goal.id);
          setGoals(prev => prev.filter(g => g.id !== goal.id));
        },
      },
    ]);
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
        <Text variant="headlineLarge" style={styles.title}>Metas financeiras</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Acompanhe o progresso dos seus objetivos</Text>

        {goals.length === 0 ? (
          <GlassCard style={styles.card}>
            <Text style={styles.emptyText}>Nenhuma meta cadastrada ainda.</Text>
          </GlassCard>
        ) : (
          goals.map((goal) => (
            <GlassCard key={goal.id} style={styles.card}>
              {editingId === goal.id ? (
                <>
                  <TextInput
                    label="Descrição"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    mode="flat"
                    style={styles.input}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <TextInput
                    label="Valor alvo (R$)"
                    value={editTarget}
                    onChangeText={setEditTarget}
                    keyboardType="decimal-pad"
                    mode="flat"
                    style={styles.input}
                    underlineColor="transparent"
                    textColor={Colors.textPrimary}
                  />
                  <View style={styles.editActions}>
                    <Button mode="text" onPress={() => setEditingId(null)} textColor={Colors.textSecondary}>Cancelar</Button>
                    <Button mode="contained" onPress={() => saveEdit(goal)} buttonColor={Colors.primary}>Salvar</Button>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.concluida ? '🎉 ' : ''}{goal.description}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      <IconButton icon="pencil-outline" iconColor={Colors.textSecondary} size={18} onPress={() => startEdit(goal)} />
                      <IconButton icon="trash-can-outline" iconColor={Colors.textSecondary} size={18} onPress={() => confirmDelete(goal)} />
                    </View>
                  </View>
                  <Text style={styles.goalValues}>
                    R$ {goal.currentAmount.toFixed(2)} de R$ {goal.targetAmount.toFixed(2)} ({goal.percentualUsado}%)
                  </Text>
                  <ProgressBar
                    progress={Math.min(goal.currentAmount / goal.targetAmount, 1)}
                    color={goal.concluida ? Colors.primaryLight : Colors.primary}
                    style={styles.progressBar}
                  />
                  {!goal.concluida && (
                    <View style={styles.contributeRow}>
                      <TextInput
                        placeholder="Adicionar valor (R$)"
                        value={contributions[goal.id] || ''}
                        onChangeText={(v) => setContributions(prev => ({ ...prev, [goal.id]: v }))}
                        keyboardType="decimal-pad"
                        mode="flat"
                        style={[styles.input, styles.contributeInput]}
                        underlineColor="transparent"
                        textColor={Colors.textPrimary}
                      />
                      <Button mode="contained" onPress={() => handleContribute(goal)} buttonColor={Colors.primary} compact>
                        Adicionar
                      </Button>
                    </View>
                  )}
                </>
              )}
            </GlassCard>
          ))
        )}

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Nova meta</Text>
          <TextInput
            label="Ex: Viagem, Notebook novo..."
            value={newDescription}
            onChangeText={setNewDescription}
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Valor alvo (R$)"
            value={newTarget}
            onChangeText={setNewTarget}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <Button mode="contained" onPress={handleCreate} loading={creating} buttonColor={Colors.primary} style={styles.button}>
            + Adicionar meta
          </Button>
        </GlassCard>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 130 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginBottom: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  goalValues: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.inputBackground },
  contributeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  contributeInput: { flex: 1, marginBottom: 0 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});
