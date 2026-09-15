import { getMonthStatus } from '@/services/api';

export type PostAuthRoute =
  | { pathname: '/home' }
  | { pathname: '/month-closing'; params: { month: string; year: string } };

export async function resolvePostAuthRoute(): Promise<PostAuthRoute> {
  try {
    const status = await getMonthStatus();
    if (status.needsClosing) {
      return {
        pathname: '/month-closing',
        params: { month: String(status.lastSeenMonth), year: String(status.lastSeenYear) },
      };
    }
  } catch {
    // se a checagem falhar, cai no destino padrão
  }
  return { pathname: '/home' };
}
