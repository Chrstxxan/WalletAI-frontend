import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getFinancialProfile, updateFinancialProfile } from '@/services/api';
import { GlassCard } from '@/components/GlassCard';
import { Colors } from '@/constants/colors';

export default function FinancialProfileScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [workingCapital, setWorkingCapital] = useState('');
  const [creditTypes, setCreditTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const profile = await getFinancialProfile();
        setMonthlyIncome(profile.monthlyIncome ? String(profile.monthlyIncome) : '');
        setFixedExpenses(profile.fixedExpenses ? String(profile.fixedExpenses) : '');
        setWorkingCapital(profile.workingCapital ? String(profile.workingCapital) : '');
        setCreditTypes(Array.isArray(profile.creditTypes) ? profile.creditTypes.join(', ') : '');
      } finally {
        setLoadingInitial(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const creditTypesArray = creditTypes.split(',').map(c => c.trim()).filter(Boolean);
      await updateFinancialProfile(
        parseFloat(monthlyIncome.replace(',', '.')) || 0,
        parseFloat(fixedExpenses.replace(',', '.')) || 0,
        parseFloat(workingCapital.replace(',', '.')) || 0,
        creditTypesArray
      );
      Alert.alert('Sucesso', 'Dados financeiros atualizados!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar os dados');
    } finally {
      setLoading(false);
    }
  }

  if (loadingInitial) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Meus dados financeiros</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Usados para calcular quanto você pode gastar</Text>

        <GlassCard style={styles.card}>
          <TextInput
            label="Renda mensal (R$)"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Despesas fixas mensais (R$)"
            value={fixedExpenses}
            onChangeText={setFixedExpenses}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Capital de giro (R$)"
            value={workingCapital}
            onChangeText={setWorkingCapital}
            keyboardType="decimal-pad"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />
          <TextInput
            label="Tipos de crédito (separados por vírgula)"
            value={creditTypes}
            onChangeText={setCreditTypes}
            placeholder="Ex: Cartão de crédito, Empréstimo"
            mode="flat"
            style={styles.input}
            underlineColor="transparent"
            textColor={Colors.textPrimary}
          />

          <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button} buttonColor={Colors.primary}>
            Salvar
          </Button>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.2 },
  blobTop: { top: -100, right: -80 },
  container: { padding: 24, paddingTop: 60 },
  title: { textAlign: 'center', color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: Colors.textSecondary, marginBottom: 32 },
  card: { marginTop: 8 },
  input: { backgroundColor: Colors.inputBackground, marginBottom: 12, borderRadius: 12 },
  button: { marginTop: 8, paddingVertical: 4, borderRadius: 12 },
});