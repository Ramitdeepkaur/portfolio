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
  getPortfolioSummary: () => client.get('/portfolio/summary').then(res => res.data),
  getPortfolioAllocation: () => client.get('/portfolio/allocation').then(res => res.data),
  getPortfolioPerformance: () => client.get('/portfolio/performance').then(res => res.data),

  // Holdings
  getHoldings: () => client.get('/holdings').then(res => res.data),
  getHoldingById: (id) => client.get(`/holdings/${id}`).then(res => res.data),
  createHolding: (data) => client.post('/holdings', data).then(res => res.data),
  updateHolding: (id, data) => client.put(`/holdings/${id}`, data).then(res => res.data),
  deleteHolding: (id) => client.delete(`/holdings/${id}`).then(res => res.data),

  // CSV Export/Import
  exportHoldingsCsv: () => client.get('/holdings/export/csv', { responseType: 'blob' }).then(res => res.data),
  importHoldingsCsv: (formData) => client.post('/holdings/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),

  // Market Data
  getMarketData: (ticker) => client.get(`/market/${ticker}`).then(res => res.data),
  getMarketHistory: (ticker, range = '1m') => client.get(`/market/${ticker}/history?range=${range}`).then(res => res.data),

  // Analytics
  getAnalytics: () => client.get('/analytics').then(res => res.data),
  getTopGainers: () => client.get('/analytics/top-gainers').then(res => res.data),
  getTopLosers: () => client.get('/analytics/top-losers').then(res => res.data),
};

export default api;
