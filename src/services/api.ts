import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.15.53:3000';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Credenciais inválidas');
  return response.json();
}

export async function register(name: string, email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) throw new Error('Erro ao cadastrar');
  return response.json();
}

export async function resetPassword(email: string, newPassword: string) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  if (!response.ok) throw new Error('Não foi possível redefinir a senha');
  return response.json();
}

async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function createTransaction(amount: number, type: string, description: string, benefitWalletId?: number | null) {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, type, description, benefitWalletId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.mensagem || data?.error || 'Não foi possível criar a transação');
  }
  return response.json();
}

export async function getTransactions() {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar as transações');
  return response.json();
}

export async function getFinancialProfile() {
  const response = await fetch(`${API_URL}/financial/profile`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar o perfil financeiro');
  return response.json();
}

export async function updateFinancialProfile(workingCapital: number, savingsGoal: number, creditTypes: string[]) {
  const response = await fetch(`${API_URL}/financial/profile`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ workingCapital, savingsGoal, creditTypes }),
  });
  if (!response.ok) throw new Error('Não foi possível salvar o perfil financeiro');
  return response.json();
}

export async function getIncomeSources() {
  const response = await fetch(`${API_URL}/financial/income-sources`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar as fontes de renda');
  return response.json();
}

export async function updateIncomeSources(sources: { id?: number; description: string; amount: number; recorrente: boolean; month?: number; year?: number }[]) {
  const response = await fetch(`${API_URL}/financial/income-sources`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ sources }),
  });
  if (!response.ok) throw new Error('Não foi possível salvar as fontes de renda');
  return response.json();
}

export async function getFixedExpenses() {
  const response = await fetch(`${API_URL}/financial/fixed-expenses`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar as despesas fixas');
  return response.json();
}

export async function updateFixedExpenses(items: { id?: number; description: string; amount: number; recorrente: boolean; month?: number; year?: number; creditCardId?: number | null }[]) {
  const response = await fetch(`${API_URL}/financial/fixed-expenses`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error('Não foi possível salvar as despesas fixas');
  return response.json();
}

export async function getDashboard() {
  const response = await fetch(`${API_URL}/financial/dashboard`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar o dashboard');
  return response.json();
}

export async function updateTransaction(id: number, amount: number, type: string, description: string, benefitWalletId?: number | null) {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, type, description, benefitWalletId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.mensagem || data?.error || 'Não foi possível atualizar a transação');
  }
  return response.json();
}

export async function deleteTransaction(id: number) {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível excluir a transação');
  return response.json();
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error('Não foi possível enviar a mensagem');
  return response.json();
}

export async function getChatHistory() {
  const response = await fetch(`${API_URL}/chat/history`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar o histórico');
  return response.json();
}

export async function clearChatHistory() {
  const response = await fetch(`${API_URL}/chat/history`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível apagar o histórico');
  return response.json();
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar os dados do usuário');
  return response.json();
}

export async function completeOnboarding() {
  const response = await fetch(`${API_URL}/auth/complete-onboarding`, { method: 'POST', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível concluir o tutorial');
  return response.json();
}

export async function updateMe(name: string, email: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name, email }),
  });
  if (!response.ok) throw new Error('Não foi possível atualizar os dados');
  return response.json();
}

export async function getCreditCards() {
  const response = await fetch(`${API_URL}/credit-cards`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar os cartões');
  return response.json();
}

export async function createCreditCard(name: string, limit: number) {
  const response = await fetch(`${API_URL}/credit-cards`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name, limit }),
  });
  if (!response.ok) throw new Error('Não foi possível criar o cartão');
  return response.json();
}

export async function deleteCreditCard(id: number) {
  const response = await fetch(`${API_URL}/credit-cards/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível excluir o cartão');
  return response.json();
}

export async function addInvoiceItem(cardId: number, month: number, year: number, description: string, installmentAmount: number, currentInstallment: number, totalInstallments: number) {
  const response = await fetch(`${API_URL}/credit-cards/${cardId}/invoice-items`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ month, year, description, installmentAmount, currentInstallment, totalInstallments }),
  });
  if (!response.ok) throw new Error('Não foi possível adicionar o item');
  return response.json();
}

export async function updateInvoiceItem(id: number, data: { description: string; installmentAmount: number; currentInstallment: number; totalInstallments: number }) {
  const response = await fetch(`${API_URL}/credit-cards/invoice-items/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Não foi possível atualizar o item');
  return response.json();
}

export async function deleteInvoiceItem(id: number) {
  const response = await fetch(`${API_URL}/credit-cards/invoice-items/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível excluir o item');
  return response.json();
}

export async function getCreditCardSummary() {
  const response = await fetch(`${API_URL}/credit-cards/summary`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar o resumo dos cartões');
  return response.json();
}

export async function getCardInvoices(cardId: number) {
  const response = await fetch(`${API_URL}/credit-cards/${cardId}/invoices`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar as faturas');
  return response.json();
}

export async function generateMonthlyFixedExpenses() {
  const response = await fetch(`${API_URL}/financial/fixed-expenses/generate-monthly`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível gerar os records mensais');
  return response.json();
}

export async function getMonthlyFixedExpenseRecords() {
  const response = await fetch(`${API_URL}/financial/fixed-expenses/monthly-records`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar os records mensais');
  return response.json();
}

export async function toggleFixedExpensePaid(id: number) {
  const response = await fetch(`${API_URL}/financial/fixed-expenses/records/${id}/toggle-paid`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível atualizar o status');
  return response.json();
}

export async function generateMonthlyIncome() {
  const response = await fetch(`${API_URL}/financial/income-sources/generate-monthly`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível gerar os registros de renda mensais');
  return response.json();
}

export async function getMonthlyIncomeRecords() {
  const response = await fetch(`${API_URL}/financial/income-sources/monthly-records`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar os registros de renda mensais');
  return response.json();
}

export async function toggleIncomeReceived(id: number) {
  const response = await fetch(`${API_URL}/financial/income-sources/records/${id}/toggle-received`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível atualizar o status');
  return response.json();
}

export async function getMonthStatus() {
  const response = await fetch(`${API_URL}/financial/month-status`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível verificar o status do mês');
  return response.json();
}

export async function getMonthSummary(month: number, year: number) {
  const response = await fetch(`${API_URL}/financial/month-summary?month=${month}&year=${year}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar o resumo do mês');
  return response.json();
}

export async function acknowledgeMonth() {
  const response = await fetch(`${API_URL}/financial/acknowledge-month`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível confirmar o fechamento do mês');
  return response.json();
}

export async function getCategoryBudgets() {
  const response = await fetch(`${API_URL}/financial/category-budgets`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Não foi possível buscar os orçamentos por categoria');
  return response.json();
}

export async function updateCategoryBudgets(budgets: { categoria: string; limite: number }[]) {
  const response = await fetch(`${API_URL}/financial/category-budgets`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ budgets }),
  });
  if (!response.ok) throw new Error('Não foi possível salvar os orçamentos por categoria');
  return response.json();
}

export async function getGoals() {
  const response = await fetch(`${API_URL}/goals`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar as metas');
  return response.json();
}

export async function createGoal(description: string, targetAmount: number) {
  const response = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ description, targetAmount }),
  });
  if (!response.ok) throw new Error('Não foi possível criar a meta');
  return response.json();
}

export async function updateGoal(id: number, data: { description?: string; targetAmount?: number; currentAmount?: number }) {
  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Não foi possível atualizar a meta');
  return response.json();
}

export async function deleteGoal(id: number) {
  const response = await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível excluir a meta');
  return response.json();
}

export async function getBenefitWallets() {
  const response = await fetch(`${API_URL}/benefit-wallets`, { method: 'GET', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível buscar as carteiras de benefício');
  return response.json();
}

export async function createBenefitWallet(type: string) {
  const response = await fetch(`${API_URL}/benefit-wallets`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ type }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Não foi possível criar a carteira');
  }
  return response.json();
}

export async function topUpBenefitWallet(id: number, amount: number) {
  const response = await fetch(`${API_URL}/benefit-wallets/${id}/topup`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Não foi possível adicionar saldo');
  }
  return response.json();
}

export async function deleteBenefitWallet(id: number) {
  const response = await fetch(`${API_URL}/benefit-wallets/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!response.ok) throw new Error('Não foi possível excluir a carteira');
  return response.json();
}