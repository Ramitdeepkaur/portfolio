import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

export const StockDetailModal = ({ ticker, isOpen, onClose }) => {
  const [activeTicker, setActiveTicker] = useState(ticker || 'AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [timeframe, setTimeframe] = useState('1m');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getMarketHistory(activeTicker, timeframe);
      setMarketData(data);
    } catch (err) {
      console.error('Failed to load market data', err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-3xl rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-brand-400 font-mono">
              {activeTicker.substring(0, 4)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{activeTicker}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">Market Watch</span>
              </h3>
              <p className="text-xs text-slate-400">Live price quotes & historical market statistics</p>
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
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 uppercase placeholder-normal focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold">
              Search
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 ml-2">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Live Metrics Grid */}
        {marketData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Price</span>
              <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                {formatCurrency(marketData.currentPrice)}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isGain ? '+' : ''}{marketData.changePercentage}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Open / Close</span>
              <div className="text-sm font-semibold text-slate-200 font-mono mt-1">
                {formatCurrency(marketData.openingPrice)}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Close: {formatCurrency(marketData.closingPrice)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Day Range (H / L)</span>
              <div className="text-xs font-semibold text-slate-200 font-mono mt-1">
                H: {formatCurrency(marketData.highPrice)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">L: {formatCurrency(marketData.lowPrice)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Volume</span>
              <div className="text-sm font-semibold text-slate-200 font-mono mt-1">
                {(marketData.volume / 1000000).toFixed(2)}M
              </div>
              <span className="text-[11px] text-slate-500">Shares Traded</span>
            </div>
          </div>
        )}

        {/* Timeframe Selector & Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Historical Price Trend</span>
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              {['1w', '1m', '6m', '1y', '5y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeframe(range)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                    timeframe === range ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
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
      </div>
    </div>
  );
};

export default StockDetailModal;
