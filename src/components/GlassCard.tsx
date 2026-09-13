import { StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';

export function GlassCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.outer, style]} {...props}>
      <View style={[StyleSheet.absoluteFill, styles.backgroundLayer]} pointerEvents="none">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  backgroundLayer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  tintOverlay: {
    backgroundColor: Colors.glassTint,
  },
  content: {
    padding: 20,
  },
});