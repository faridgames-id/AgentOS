const API_BASE = '/api'

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json() as Promise<T>
}

export const api = {
  // Agents
  getAgents: () => request<{ agents: any[]; count: number }>('/agents'),
  getAgent: (id: number) => request<any>(`/agents/${id}`),
  assignTask: (id: number, task: string) => 
    request<any>(`/agents/${id}/task`, { method: 'POST', body: JSON.stringify({ task }) }),
  completeTask: (id: number, result: string = '') => 
    request<any>(`/agents/${id}/complete`, { method: 'POST', body: JSON.stringify({ result }) }),
  
  // Finance
  getTransactions: (month?: string) => 
    request<{ transactions: any[]; count: number }>(`/finance/transactions${month ? `?month=${month}` : ''}`),
  getSummary: () => request<any>('/finance/summary'),
  addIncome: (data: { amount: number; category: string; description: string }) => 
    request('/finance/add-income', { method: 'POST', body: JSON.stringify(data) }),
  addExpense: (data: { amount: number; category: string; description: string }) => 
    request('/finance/add-expense', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => 
    request(`/finance/transaction/${id}`, { method: 'DELETE' }),
  
  // Stock (ZEPHRA)
  getStock: () => request<{ items: any[]; count: number }>('/stock/'),
  getStockSummary: () => request<any>('/stock/summary'),
  addStockItem: (data: any) => 
    request('/stock/', { method: 'POST', body: JSON.stringify(data) }),
  deleteStockItem: (id: string) => 
    request(`/stock/${id}`, { method: 'DELETE' }),
}
