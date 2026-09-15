import { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useRouter, useSegments } from 'expo-router';
import { Colors } from '@/constants/colors';

const ITEMS = [
  { key: 'home', icon: 'home-outline', label: 'Início', route: '/home', raised: false },
  { key: 'cards', icon: 'credit-card-outline', label: 'Cartões', route: '/credit-cards', raised: false },
  { key: 'chat', icon: 'robot-outline', label: 'Wally', route: '/chat', raised: true },
  { key: 'goals', icon: 'flag-checkered', label: 'Metas', route: '/goals', raised: false },
  { key: 'profile', icon: 'account-outline', label: 'Perfil', route: '/profile', raised: false },
] as const;

type NavItem = (typeof ITEMS)[number];

function NavBarButton({ item, active }: { item: NavItem; active: boolean }) {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(0)).current;

  function animateTo(toValue: number) {
    Animated.spring(translateY, { toValue, useNativeDriver: true, speed: 30, bounciness: 9 }).start();
  }

  if (item.raised) {
    return (
      <Pressable
        onPress={() => (active ? undefined : router.push(item.route))}
        onPressIn={() => animateTo(-6)}
        onPressOut={() => animateTo(0)}
        style={styles.raisedWrap}
        hitSlop={10}
      >
        <Animated.View style={[styles.raisedCircle, { transform: [{ translateY }] }]}>
          <Icon source={item.icon} size={24} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.raisedLabel} numberOfLines={1} adjustsFontSizeToFit>
          {item.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => (active ? undefined : router.push(item.route))}
      onPressIn={() => animateTo(4)}
      onPressOut={() => animateTo(0)}
      style={styles.item}
      hitSlop={8}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ translateY }] }]}>
        <Icon source={item.icon} size={21} color={active ? Colors.primaryLight : Colors.textSecondary} />
        <Text
          style={[styles.itemLabel, active && styles.itemLabelActive]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BottomNavBar() {
  const segments = useSegments();
  const currentRoute = `/${segments[0] ?? ''}`;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {ITEMS.map((item) => (
          <NavBarButton key={item.key} item={item} active={item.route === currentRoute} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 16, right: 16, bottom: 0, paddingBottom: 18 },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(18,18,18,0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 2, minWidth: 0 },
  itemInner: { alignItems: 'center', width: '100%' },
  itemLabel: { color: Colors.textSecondary, fontSize: 10, marginTop: 3, fontWeight: '600', textAlign: 'center' },
  itemLabelActive: { color: Colors.primaryLight },
  raisedWrap: { flex: 1, alignItems: 'center', marginTop: -26, minWidth: 0 },
  raisedCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  raisedLabel: { color: Colors.textPrimary, fontSize: 10, marginTop: 4, fontWeight: '700', textAlign: 'center', width: '100%' },
});
