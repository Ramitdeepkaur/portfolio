import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  sellHolding: (id, quantity, notes) => client.post(`/holdings/${id}/sell`, { quantity, notes }).then((res) => res.data),

  // CSV Export/Import
  exportHoldingsCsv: () => client.get('/holdings/export/csv', { responseType: 'blob' }).then((res) => res.data),
  importHoldingsCsv: (formData) =>
    client
      .post('/holdings/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),

  // Market Data (live Yahoo Finance via Spring backend)
  getMarketData: (ticker) => client.get(`/market/${ticker}`).then((res) => res.data),
  getMarketHistory: (ticker, range = '1m') =>
    client.get(`/market/${ticker}/history?range=${range}`).then((res) => res.data),
  refreshMarket: () => client.post('/market/refresh').then((res) => res.data),
  getWatchlist: (symbols) =>
    client
      .get('/market/watchlist', {
        params: symbols ? { symbols: Array.isArray(symbols) ? symbols.join(',') : symbols } : {},
      })
      .then((res) => res.data),

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

  // Transactions — API only (no fake local seed data)
  getTransactions: () => client.get('/transactions').then((res) => res.data),
  getHoldingTransactions: (holdingId) =>
    client.get(`/transactions/holding/${encodeURIComponent(holdingId)}`).then((res) => res.data),
  getTransactionsByDateRange: (start, end) =>
    client.get('/transactions', { params: { start, end } }).then((res) => res.data),
  createTransaction: (data) => client.post('/transactions', data).then((res) => res.data),
  updateTransaction: (id, data) => client.put(`/transactions/${id}`, data).then((res) => res.data),
  deleteTransaction: (id) => client.delete(`/transactions/${id}`).then((res) => res.data),
  getTransactionStats: () => client.get('/transactions/stats').then((res) => res.data),

  getAuditLogs: async (params = {}) => {
    try {
      return await client.get('/audit-logs', { params }).then((res) => res.data);
    } catch {
      return [];
    }
  },
  getHoldingAuditLogs: async (holdingId) => {
    try {
      return await client
        .get(`/audit-logs/entity/${encodeURIComponent(holdingId)}`)
        .then((res) => res.data);
    } catch {
      return [];
    }
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
