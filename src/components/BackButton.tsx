import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

export function BackButton() {
  const router = useRouter();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <IconButton
        icon="chevron-left"
        size={26}
        iconColor={Colors.textPrimary}
        style={styles.button}
        onPress={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 52, left: 12, zIndex: 10, elevation: 10 },
  button: { backgroundColor: 'rgba(255,255,255,0.08)', margin: 0 },
});
