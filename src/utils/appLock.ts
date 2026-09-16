import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const APP_LOCK_KEY = 'appLockEnabled';

export async function isAppLockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(APP_LOCK_KEY);
  return value === '1';
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(APP_LOCK_KEY, '1');
  } else {
    await SecureStore.deleteItemAsync(APP_LOCK_KEY);
  }
}

export async function isDeviceLockAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

// O próprio prompt nativo de Face ID/biometria faz o app "sair de foco" por uma fração
// de segundo no SO (mesmo comportamento de abrir outro app), o que dispara o listener de
// AppState em _layout.tsx como se o app tivesse ido pra segundo plano de verdade — sem essa
// janela de supressão, isso recria a tela de bloqueio logo depois de um desbloqueio bem
// sucedido, num loop infinito.
let suppressGateUntil = 0;

export function suppressAppLockGateFor(ms: number) {
  suppressGateUntil = Date.now() + ms;
}

export function isAppLockGateSuppressed() {
  return Date.now() < suppressGateUntil;
}

// Guarda a tela em que o usuário estava quando o app foi pra segundo plano e a trava
// disparou, pra devolver ele lá depois de desbloquear (em vez de sempre cair na home).
let pendingReturnRoute: string | null = null;

export function setPendingReturnRoute(route: string | null) {
  pendingReturnRoute = route;
}

export function consumePendingReturnRoute(): string | null {
  const route = pendingReturnRoute;
  pendingReturnRoute = null;
  return route;
}

export async function unlockWithDeviceAuth(): Promise<boolean> {
  suppressAppLockGateFor(8000);
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloqueie o WalletAI',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  } finally {
    suppressAppLockGateFor(3000);
  }
}
