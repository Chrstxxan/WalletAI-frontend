import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';

export function GlassCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.wrapper, style]} {...props}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tintOverlay: {
    backgroundColor: Colors.glassTint,
  },
  content: {
    padding: 20,
  },
});