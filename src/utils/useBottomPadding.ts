import { useSafeAreaInsets } from 'react-native-safe-area-context';

// soma o respiro visual já usado em cada tela com a área segura de baixo do
// aparelho (barra de gestos/3 botões do Android) — sem isso, botões no fim de
// uma ScrollView ficam parcialmente cobertos pela barra de sistema em builds
// standalone (o Expo Go não expõe esse problema, tem chrome próprio).
export function useBottomPadding(base: number): number {
  const insets = useSafeAreaInsets();
  return base + insets.bottom;
}
