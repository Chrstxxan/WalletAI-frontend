import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/colors';
import { isAppLockEnabled, isDeviceLockAvailable, isAppLockGateSuppressed, setPendingReturnRoute } from '@/utils/appLock';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.background,
  },
};

const ROUTES_SEM_TRAVA = ['login', 'register', 'forgot-password', 'app-lock', undefined];

function useAppLockGate() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const cameFromBackground = appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (!cameFromBackground) return;
      if (isAppLockGateSuppressed()) return;

      const currentRoute = segmentsRef.current[0];
      if (ROUTES_SEM_TRAVA.includes(currentRoute as string | undefined)) return;

      const enabled = await isAppLockEnabled();
      if (!enabled) return;
      const available = await isDeviceLockAvailable();
      if (!available) return;

      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      // guarda a tela atual pra devolver o usuário nela depois de desbloquear,
      // em vez de sempre reiniciar na home
      setPendingReturnRoute(pathnameRef.current);
      router.replace('/app-lock');
    });
    return () => subscription.remove();
  }, [router]);
}

export default function RootLayout() {
  useAppLockGate();

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </PaperProvider>
  );
}