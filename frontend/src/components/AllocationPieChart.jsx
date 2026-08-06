import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Dezerv palette for chart slices
const DZ_COLORS = [
  '#769356', // sage green
  '#e28761', // amber
  '#82a057', // green2
  '#52525b', // benchmark grey
  '#a16207', // warm gold
  '#0e7490', // teal
  '#7c3aed', // violet
];

const DZ_BORDER = '#27272a';
const DZ_CARD2  = '#17171c';
const DZ_MUTED  = '#71717a';
const DZ_SUBTLE = '#a1a1aa';

export const AllocationPieChart = ({ allocation }) => {
  const [viewMode, setViewMode] = useState('assetType');

  if (!allocation) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-dz-muted">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-dz-amber border-t-transparent animate-spin" />
          Loading Allocation Data…
        </div>
      </div>
    );
  }

  const data = viewMode === 'assetType' ? allocation.byAssetType : allocation.bySector;

  const chartData = (data || []).map((item) => ({
    name:       item.category,
    value:      Number(item.value),
    percentage: Number(item.percentage),
  }));

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  /* ── Custom Tooltip ── */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
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
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</p>
        <p style={{ color: '#82a057', fontWeight: 700, fontFamily: 'monospace' }}>
          {formatCurrency(d.value)}
        </p>
        <p style={{ color: DZ_MUTED, marginTop: 2 }}>{d.percentage}% of portfolio</p>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Asset Allocation</h3>
          <p className="text-xs text-dz-muted mt-0.5">
            By {viewMode === 'assetType' ? 'Asset Type' : 'Sector'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center p-1 bg-dz-dark border border-dz-border rounded-xl gap-0.5">
          {['assetType', 'sector'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === mode
                  ? 'bg-dz-green text-white shadow-sm'
                  : 'text-dz-muted hover:text-white'
              }`}
            >
              {mode === 'assetType' ? 'Type' : 'Sector'}
            </button>
          ))}
        </div>
      </div>

      {/* Donut */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DZ_COLORS[index % DZ_COLORS.length]}
                  stroke="#000000"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / breakdown */}
      <div className="mt-4 pt-4 border-t border-dz-border grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {chartData.slice(0, 6).map((item, idx) => (
          <div
            key={item.name}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-dz-dark/60"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: DZ_COLORS[idx % DZ_COLORS.length] }}
            />
            <div className="truncate">
              <span className="font-medium text-dz-subtle block truncate">{item.name}</span>
              <span className="text-[11px] text-dz-muted font-mono">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationPieChart;
