import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/colors';
import { isAppLockEnabled, isDeviceLockAvailable } from '@/utils/appLock';
import { resolvePostAuthRoute } from '@/utils/postAuthRoute';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const glowSize = Math.max(width, height) * 1.5;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -10, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    async function decidirDestino() {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        setTimeout(() => router.replace('/login'), 2200);
        return;
      }

      const lockEnabled = await isAppLockEnabled();
      if (lockEnabled && (await isDeviceLockAvailable())) {
        setTimeout(() => router.replace('/app-lock'), 2200);
        return;
      }

      const dest = await resolvePostAuthRoute();
      setTimeout(() => router.replace(dest as any), 2200);
    }
    decidirDestino();
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[StyleSheet.absoluteFill, styles.glowContainer]} pointerEvents="none">
        <Animated.View
          style={[
            styles.glowCircle,
            { width: glowSize, height: glowSize, borderRadius: glowSize / 2 },
            { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.1, 0.22] }) },
          ]}
        />
        <Animated.View
          style={[
            styles.glowCircle,
            { width: glowSize * 0.72, height: glowSize * 0.72, borderRadius: (glowSize * 0.72) / 2 },
            { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.16, 0.32] }) },
          ]}
        />
        <Animated.View
          style={[
            styles.glowCircle,
            { width: glowSize * 0.48, height: glowSize * 0.48, borderRadius: (glowSize * 0.48) / 2 },
            { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.22, 0.42] }) },
          ]}
        />
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <Animated.View style={[styles.logoWrapper, { opacity, transform: [{ scale }, { translateY }] }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  logoWrapper: { justifyContent: 'center', alignItems: 'center' },
  glowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    backgroundColor: Colors.primary,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
});