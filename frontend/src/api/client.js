import axios from 'axios';

const API_BASE_URL = '/api';
const TRANSACTIONS_STORAGE_KEY = 'portfolio_transactions';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const defaultTransactions = [
  { id: 'tx-1', holding: 'AAPL', type: 'BUY', quantity: 10, price: 185.5, amount: 1855, date: '2026-07-01', notes: 'Initial entry' },
  { id: 'tx-2', holding: 'MSFT', type: 'BUY', quantity: 4, price: 420.2, amount: 1680.8, date: '2026-07-07', notes: 'Added to position' },
  { id: 'tx-3', holding: 'NVDA', type: 'SELL', quantity: 2, price: 125.6, amount: 251.2, date: '2026-07-14', notes: 'Trimmed position' },
];

const defaultAuditLogs = [
  { id: 'audit-1', entity: 'AAPL', action: 'CREATE', date: '2026-07-01', user: 'Alex', ipAddress: '192.168.0.10', summary: 'Created a new holding entry', before: 'No record', after: 'Added 10 shares at $185.50' },
  { id: 'audit-2', entity: 'MSFT', action: 'UPDATE', date: '2026-07-07', user: 'Alex', ipAddress: '192.168.0.10', summary: 'Adjusted average cost basis', before: 'Previous average cost: $400.00', after: 'Updated average cost: $420.20' },
  { id: 'audit-3', entity: 'NVDA', action: 'DELETE', date: '2026-07-14', user: 'Taylor', ipAddress: '192.168.0.25', summary: 'Removed partial position', before: '2 shares held', after: '0 shares held' },
];

const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadStoredTransactions = () => {
  if (!hasLocalStorage()) return defaultTransactions;

  const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
};

const saveStoredTransactions = (transactions) => {
  if (hasLocalStorage()) {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }
  return transactions;
};

const readJson = async (endpoint, fallback) => {
  try {
    return await client.get(endpoint).then((res) => res.data);
  } catch (err) {
    return fallback;
  }
};

export const api = {
  // Portfolio
  getPortfolioSummary: () => client.get('/portfolio/summary').then((res) => res.data),
  getPortfolioAllocation: () => client.get('/portfolio/allocation').then((res) => res.data),
  getPortfolioPerformance: () => client.get('/portfolio/performance').then((res) => res.data),

  // Holdings
  getHoldings: () => client.get('/holdings').then((res) => res.data),
  searchHoldings: (criteria = {}) => client.get('/holdings/search', { params: criteria }).then((res) => res.data),
  getFilterOptions: () => client.get('/holdings/filters/options').then((res) => res.data),
  getHoldingById: (id) => client.get(`/holdings/${id}`).then((res) => res.data),
  createHolding: (data) => client.post('/holdings', data).then((res) => res.data),
  updateHolding: (id, data) => client.put(`/holdings/${id}`, data).then((res) => res.data),
  deleteHolding: (id) => client.delete(`/holdings/${id}`).then((res) => res.data),

  // CSV Export/Import
  exportHoldingsCsv: () => client.get('/holdings/export/csv', { responseType: 'blob' }).then((res) => res.data),
  importHoldingsCsv: (formData) => client.post('/holdings/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data),

  // Market Data
  getMarketData: (ticker) => client.get(`/market/${ticker}`).then((res) => res.data),
  getMarketHistory: (ticker, range = '1m') => client.get(`/market/${ticker}/history?range=${range}`).then((res) => res.data),

  // Analytics
  getAnalytics: () => client.get('/analytics').then((res) => res.data),
  getTopGainers: () => client.get('/analytics/top-gainers').then((res) => res.data),
  getTopLosers: () => client.get('/analytics/top-losers').then((res) => res.data),

  // Scenarios
  getScenarios: (params = {}) => client.get('/scenarios', { params }).then((res) => res.data),
  getScenarioById: (id) => client.get(`/scenarios/${id}`).then((res) => res.data),
  createScenario: (data) => client.post('/scenarios', data).then((res) => res.data),
  updateScenario: (id, data) => client.put(`/scenarios/${id}`, data).then((res) => res.data),
  deleteScenario: (id) => client.delete(`/scenarios/${id}`).then((res) => res.data),
  duplicateScenario: (id) => client.post(`/scenarios/${id}/duplicate`).then((res) => res.data),

  // Transactions & audit trail
  getTransactions: async () => {
    try {
      return await client.get('/transactions').then((res) => res.data);
    } catch (err) {
      return loadStoredTransactions();
    }
  },
  getHoldingTransactions: async (holdingId) => {
    try {
      return await client.get(`/transactions/holding/${encodeURIComponent(holdingId)}`).then((res) => res.data);
    } catch {
      const transactions = await api.getTransactions();
      return transactions.filter((tx) => tx.holding === holdingId);
    }
  },
  getTransactionsByDateRange: async (start, end) => {
    try {
      return await client.get('/transactions', { params: { start, end } }).then((res) => res.data);
    } catch {
      const transactions = await api.getTransactions();
      return transactions.filter((tx) => tx.date >= start && tx.date <= end);
    }
  },
  createTransaction: async (data) => {
    try {
      return await client.post('/transactions', data).then((res) => res.data);
    } catch {
      const transactions = loadStoredTransactions();
      const newTransaction = { ...data, id: data.id || `tx-${Date.now()}` };
      saveStoredTransactions([newTransaction, ...transactions]);
      return newTransaction;
    }
  },
  updateTransaction: async (id, data) => {
    try {
      return await client.put(`/transactions/${id}`, data).then((res) => res.data);
    } catch {
      const transactions = loadStoredTransactions().map((tx) => (tx.id === id ? { ...tx, ...data } : tx));
      saveStoredTransactions(transactions);
      return transactions.find((tx) => tx.id === id);
    }
  },
  deleteTransaction: async (id) => {
    try {
      return await client.delete(`/transactions/${id}`).then((res) => res.data);
    } catch {
      const transactions = loadStoredTransactions().filter((tx) => tx.id !== id);
      saveStoredTransactions(transactions);
      return { success: true };
    }
  },
  getTransactionStats: async () => {
    try {
      return await client.get('/transactions/stats').then((res) => res.data);
    } catch {
      const transactions = await api.getTransactions();
      const totalVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const buyVolume = transactions.filter((tx) => tx.type === 'BUY').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const sellVolume = transactions.filter((tx) => tx.type === 'SELL').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      return { totalTransactions: transactions.length, totalVolume, buyVolume, sellVolume };
    }
  },
  getAuditLogs: async () => {
    try {
      return await client.get('/audit-logs').then((res) => res.data);
    } catch {
      return defaultAuditLogs;
    }
  },
  getHoldingAuditLogs: async (holdingId) => {
    const logs = await api.getAuditLogs();
    return logs.filter((log) => log.entity === holdingId);
  },
  exportTransactionsCsv: async () => {
    const transactions = await api.getTransactions();
    const header = 'holding,type,quantity,price,amount,date,notes\n';
    const body = transactions
      .map(
        (tx) =>
          `${tx.holding},${tx.type},${tx.quantity},${tx.price},${tx.amount},${tx.date},${(tx.notes || '').replace(/,/g, ' ')}`,
      )
      .join('\n');
    return new Blob([header + body], { type: 'text/csv' });
  },
};

export default api;
