import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceAreaChart = ({ performance }) => {
  const [timeframe, setTimeframe] = useState('1y');

  if (!performance || !performance.history) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-slate-500">
        Loading Performance Growth Curve...
      </div>
    );
  }

  const history = performance.history || [];

  const filterHistoryByTimeframe = () => {
    if (history.length <= 1) return history;
    const count = history.length;
    switch (timeframe) {
      case '1m': return history.slice(Math.max(0, count - 4));
      case '6m': return history.slice(Math.max(0, count - 7));
      case '1y': return history;
      case '5y': return history;
      default: return history;
    }
  };

  const chartData = filterHistoryByTimeframe().map(item => ({
    date: item.snapshotDate,
    value: Number(item.portfolioValue),
    invested: Number(item.investedAmount),
    profitLoss: Number(item.profitLoss),
  }));

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-xl text-xs font-sans space-y-1">
          <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Portfolio Value:</span>
            <span className="font-bold text-brand-400 font-mono">{formatCurrency(payload[0].value)}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Total Invested:</span>
              <span className="font-semibold text-slate-300 font-mono">{formatCurrency(payload[1].value)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Portfolio Performance Curve</h3>
          <p className="text-xs text-slate-400">Historical growth trend and total capital invested over time</p>
        </div>

        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {['1m', '6m', '1y', '5y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                timeframe === tf ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
            <Area type="monotone" dataKey="invested" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorInvested)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-brand-500 rounded-full" />
          <span>Portfolio Value</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-500 border border-dashed border-emerald-400 rounded-full" />
          <span>Invested Amount</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAreaChart;
