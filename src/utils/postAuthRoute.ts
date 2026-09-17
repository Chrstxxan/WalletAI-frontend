import { getMonthStatus } from '@/services/api';
import { consumePendingReturnRoute } from '@/utils/appLock';

export type PostAuthRoute =
  | { pathname: string }
  | { pathname: '/month-closing'; params: { month: string; year: string } };

export async function resolvePostAuthRoute(): Promise<PostAuthRoute> {
  try {
    const status = await getMonthStatus();
    if (!status.onboardingCompleted) {
      // tutorial de primeiro acesso tem prioridade sobre tudo — nem faz sentido
      // mostrar fechamento de mês ou voltar pra uma tela antiga antes disso
      consumePendingReturnRoute();
      return { pathname: '/onboarding' };
    }
    if (status.needsClosing) {
      // fechamento de mês tem prioridade sobre voltar pra tela anterior
      consumePendingReturnRoute();
      return {
        pathname: '/month-closing',
        params: { month: String(status.lastSeenMonth), year: String(status.lastSeenYear) },
      };
    }
  } catch {
    // se a checagem falhar, cai no destino padrão
  }
  const returnTo = consumePendingReturnRoute();
  return { pathname: returnTo || '/home' };
}
