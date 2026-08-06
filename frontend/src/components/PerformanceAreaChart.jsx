import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dezerv palette constants
const DZ_GREEN  = '#769356';
const DZ_GREEN2 = '#82a057';
const DZ_BENCH  = '#52525b';
const DZ_BORDER = '#27272a';
const DZ_CARD2  = '#17171c';
const DZ_MUTED  = '#71717a';
const DZ_SUBTLE = '#a1a1aa';

export const PerformanceAreaChart = ({ performance }) => {
  const [timeframe, setTimeframe] = useState('1y');

  if (!performance || !performance.history) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-dz-muted">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-dz-amber border-t-transparent animate-spin" />
          Loading Performance Curve…
        </div>
      </div>
    );
  }

  const history = performance.history || [];

  const filterByTimeframe = () => {
    if (history.length <= 1) return history;
    const days =
      timeframe === '1m' ? 30
      : timeframe === '6m' ? 180
      : timeframe === '5y' ? 1825
      : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = history.filter((item) => {
      const d = new Date(item.snapshotDate);
      return !Number.isNaN(d.getTime()) && d >= cutoff;
    });
    return filtered.length > 0 ? filtered : history;
  };

  const chartData = filterByTimeframe().map((item) => ({
    date:      item.snapshotDate,
    value:     Number(item.portfolioValue),
    invested:  Number(item.investedAmount),
    profitLoss: Number(item.profitLoss),
  }));

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(val);

  /* ── Custom Tooltip ── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: DZ_CARD2,
          border: `1px solid ${DZ_BORDER}`,
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 12,
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          minWidth: 170,
        }}
      >
        <p style={{ color: DZ_SUBTLE, borderBottom: `1px solid ${DZ_BORDER}`, paddingBottom: 6, marginBottom: 6, fontWeight: 600 }}>
          {label}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: DZ_MUTED }}>Portfolio:</span>
          <span style={{ color: DZ_GREEN2, fontWeight: 700, fontFamily: 'monospace' }}>
            {formatCurrency(payload[0].value)}
          </span>
        </div>
        {payload[1] && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
            <span style={{ color: DZ_MUTED }}>Invested:</span>
            <span style={{ color: DZ_SUBTLE, fontWeight: 600, fontFamily: 'monospace' }}>
              {formatCurrency(payload[1].value)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const timeframes = ['1m', '6m', '1y', '5y'];

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-white">Portfolio Performance</h3>
          <p className="text-xs text-dz-muted mt-0.5">Live market marks vs invested cost basis</p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center p-1 bg-dz-dark border border-dz-border rounded-xl gap-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                timeframe === tf
                  ? 'bg-dz-green text-white shadow-sm'
                  : 'text-dz-muted hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dzColorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={DZ_GREEN}  stopOpacity={0.45} />
                <stop offset="95%" stopColor={DZ_GREEN}  stopOpacity={0.0}  />
              </linearGradient>
              <linearGradient id="dzColorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={DZ_BENCH} stopOpacity={0.3} />
                <stop offset="95%" stopColor={DZ_BENCH} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={DZ_BORDER}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke={DZ_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: DZ_MUTED }}
            />
            <YAxis
              stroke={DZ_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: DZ_MUTED }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Portfolio value — sage green */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={DZ_GREEN2}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dzColorValue)"
              dot={false}
              activeDot={{ r: 5, fill: DZ_GREEN2, strokeWidth: 0 }}
            />
            {/* Invested baseline — benchmark grey */}
            <Area
              type="monotone"
              dataKey="invested"
              stroke={DZ_BENCH}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#dzColorInvested)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-dz-muted">
        <div className="flex items-center gap-2">
          <span className="w-5 h-0.5 rounded-full" style={{ background: DZ_GREEN2 }} />
          <span>Portfolio Value</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-5 rounded-full"
            style={{
              height: 2,
              background: `repeating-linear-gradient(90deg, ${DZ_BENCH} 0, ${DZ_BENCH} 4px, transparent 4px, transparent 8px)`,
            }}
          />
          <span>Cost Basis</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAreaChart;
