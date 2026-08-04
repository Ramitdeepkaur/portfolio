import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export const StockDetailModal = ({ ticker, isOpen, onClose }) => {
  const [activeTicker, setActiveTicker] = useState(ticker || 'AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [timeframe, setTimeframe] = useState('1m');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (ticker) {
      setActiveTicker(ticker);
    }
  }, [ticker]);

  useEffect(() => {
    if (isOpen && activeTicker) {
      fetchData();
    }
  }, [isOpen, activeTicker, timeframe]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onClose]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getMarketHistory(activeTicker, timeframe);
      setMarketData(data);
    } catch (err) {
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveTicker(searchInput.toUpperCase().trim());
      setSearchInput('');
    }
  };

  if (!isOpen) return null;

  const isGain = marketData?.changeAmount >= 0;
  const historyData = (marketData?.history || []).map(p => ({
    date: p.date,
    price: Number(p.close),
  }));

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overlay-fade" role="dialog" aria-modal="true" aria-label="Market detail">
      <div className="glass-card w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-5 modal-panel max-h-[90vh] overflow-y-auto">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold font-mono flex-shrink-0 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-brand-600 dark:text-brand-400">{activeTicker.substring(0, 4)}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{activeTicker}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono dark:bg-slate-800 dark:text-slate-300">Market Watch</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live price quotes & historical market statistics</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Ticker (e.g. TSLA)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 uppercase placeholder-normal focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold">
              Search
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 ml-1 dark:hover:text-white dark:hover:bg-slate-900" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Live Metrics Grid */}
        {loading ? (
          <div className="py-14 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading market data...
          </div>
        ) : marketData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Current Price</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {formatCurrency(marketData.currentPrice)}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isGain ? '+' : ''}{marketData.changePercentage}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Open / Close</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono mt-1">
                {formatCurrency(marketData.openingPrice)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Close: {formatCurrency(marketData.closingPrice)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Day Range (H / L)</span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono mt-1">
                H: {formatCurrency(marketData.highPrice)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">L: {formatCurrency(marketData.lowPrice)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Volume</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono mt-1">
                {(marketData.volume / 1000000).toFixed(2)}M
              </div>
              <span className="text-[11px] text-slate-400">Shares Traded</span>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm">
            Could not load market data for "{activeTicker}". It may be unavailable in the demo dataset.
          </div>
        )}

        {/* Timeframe Selector & Chart */}
        {marketData && !loading && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Historical Price Trend</span>
              <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
                {['1w', '1m', '6m', '1y', '5y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeframe(range)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                      timeframe === range ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)'} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isGain ? '#10b981' : '#f43f5e'}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetailModal;