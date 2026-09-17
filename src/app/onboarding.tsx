import { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { completeOnboarding } from '@/services/api';
import { Colors } from '@/constants/colors';

type Slide = { icon: string; title: string; description: string };

const SLIDES: Slide[] = [
  {
    icon: 'wallet-outline',
    title: 'Bem-vindo ao WalletAI',
    description: 'Vamos te mostrar rapidinho como organizar suas finanças no app. Leva menos de um minuto.',
  },
  {
    icon: 'cash-multiple',
    title: 'Renda e despesas fixas',
    description: 'Em "Meus dados financeiros", cadastre suas fontes de renda (salário, freelas...) e suas contas fixas (aluguel, internet...). Marque cada uma como recorrente (todo mês) ou pontual (só um mês específico).',
  },
  {
    icon: 'credit-card-outline',
    title: 'Cartões de crédito',
    description: 'Cadastre seus cartões com o limite em "Cartões de crédito" e lance as compras, parceladas ou não, direto na fatura do mês certo.',
  },
  {
    icon: 'food-fork-drink',
    title: 'Benefícios de trabalho (se você tiver)',
    description: 'Recebe VR, VA ou cartão combustível da empresa? Cadastre em "Benefícios de trabalho" — a Wally confere automaticamente se cada gasto faz sentido pro tipo de benefício.',
  },
  {
    icon: 'swap-horizontal',
    title: 'Transações do dia a dia',
    description: 'Registre seus gastos e receitas a qualquer momento — a Wally categoriza tudo sozinha, e você pode perguntar sobre suas finanças no chat quando quiser.',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ again?: string }>();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  const isLast = index === SLIDES.length - 1;

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  function goNext() {
    if (isLast) {
      finish();
      return;
    }
    const nextIndex = index + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setIndex(nextIndex);
  }

  async function finish() {
    setFinishing(true);
    try {
      await completeOnboarding();
    } catch {
      // não bloqueia o usuário se a chamada falhar — pior caso é ver o tutorial de novo
    } finally {
      setFinishing(false);
    }
    if (params.again === '1') {
      router.back();
    } else {
      router.replace('/financial-profile');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      {!isLast && (
        <Button mode="text" onPress={finish} textColor={Colors.textSecondary} style={styles.skipButton}>
          Pular
        </Button>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Icon source={slide.icon} size={72} color={Colors.primary} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button mode="contained" onPress={goNext} loading={finishing} buttonColor={Colors.primary} style={styles.nextButton}>
          {isLast ? 'Vamos começar!' : 'Próximo'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: Colors.primary, opacity: 0.15 },
  blobTop: { top: -100, right: -80 },
  blobBottom: { bottom: -80, left: -100 },
  skipButton: { position: 'absolute', top: 52, right: 12, zIndex: 10 },
  pager: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
  iconWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: Colors.glassTint,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 22, textAlign: 'center', marginBottom: 16 },
  slideDescription: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  footer: { paddingHorizontal: 32, paddingBottom: 40, paddingTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inputBackground },
  dotActive: { width: 20, backgroundColor: Colors.primary },
  nextButton: { borderRadius: 14, paddingVertical: 4 },
});
