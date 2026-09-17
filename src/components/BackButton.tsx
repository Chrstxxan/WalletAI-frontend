import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

export function BackButton() {
  const router = useRouter();

  function handlePress() {
    // telas alcançadas por uma cadeia de router.replace (ex: login -> onboarding ->
    // financial-profile, tudo replace) não deixam nada empilhado pra voltar — cair
    // na home garante que sempre tem pra onde ir, em vez do erro "GO_BACK not handled"
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <IconButton
        icon="chevron-left"
        size={26}
        iconColor={Colors.textPrimary}
        style={styles.button}
        onPress={handlePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 52, left: 12, zIndex: 10, elevation: 10 },
  button: { backgroundColor: 'rgba(255,255,255,0.08)', margin: 0 },
});
