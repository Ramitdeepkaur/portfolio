import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const AllocationPieChart = ({ allocation }) => {
  const [viewMode, setViewMode] = useState('assetType');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!allocation) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          Loading Allocation Data...
        </div>
      </div>
    );
  }

  const data = viewMode === 'assetType' ? allocation.byAssetType : allocation.bySector;

  const chartData = (data || []).map(item => ({
    name: item.category,
    value: Number(item.value),
    percentage: Number(item.percentage),
  }));

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs font-sans dark:bg-slate-900 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-slate-200">{dataPoint.name}</p>
          <p className="text-emerald-600 font-bold mt-1 dark:text-emerald-400">{formatCurrency(dataPoint.value)}</p>
          <p className="text-slate-400 mt-0.5">{dataPoint.percentage}% of total portfolio</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Asset Allocation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution by {viewMode === 'assetType' ? 'Asset Type' : 'Sector'}</p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={() => setViewMode('assetType')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'assetType' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Asset Type
          </button>
          <button
            onClick={() => setViewMode('sector')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'sector' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sector
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)'}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {chartData.slice(0, 6).map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <div className="truncate">
              <span className="font-medium text-slate-600 dark:text-slate-300 block truncate">{item.name}</span>
              <span className="text-[11px] text-slate-400 font-mono dark:text-slate-500">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationPieChart;