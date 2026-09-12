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

export async function register(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
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

export async function createTransaction(amount: number, type: string, description: string) {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ amount, type, description }),
  });
  if (!response.ok) throw new Error('Não foi possível criar a transação');
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

export async function updateFinancialProfile(monthlyIncome: number, fixedExpenses: number, workingCapital: number, creditTypes: string[]) {
  const response = await fetch(`${API_URL}/financial/profile`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ monthlyIncome, fixedExpenses, workingCapital, creditTypes }),
  });
  if (!response.ok) throw new Error('Não foi possível salvar o perfil financeiro');
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