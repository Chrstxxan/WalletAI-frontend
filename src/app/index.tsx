import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/colors';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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
      setTimeout(() => {
        router.replace(token ? '/home' : '/login');
      }, 2200);
    }
    decidirDestino();
  }, []);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.logoWrapper, { opacity, transform: [{ scale }, { translateY }] }]}>
        <Animated.View
          style={[styles.glowOuter, { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.03, 0.08] }) }]}
        />
        <Animated.View
          style={[styles.glowMiddle, { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.06, 0.14] }) }]}
        />
        <Animated.View
          style={[styles.glowInner, { opacity: glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.1, 0.22] }) }]}
        />
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
  glowOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
  },
  glowMiddle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary,
  },
  glowInner: {
    position: 'absolute',
    width: 195,
    height: 195,
    borderRadius: 97.5,
    backgroundColor: Colors.primary,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
});