import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const AllocationPieChart = ({ allocation }) => {
  const [viewMode, setViewMode] = useState('assetType'); // 'assetType' or 'sector'

  if (!allocation) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-slate-500">
        Loading Allocation Data...
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
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-sans">
          <p className="font-semibold text-slate-200">{dataPoint.name}</p>
          <p className="text-emerald-400 font-bold mt-1">{formatCurrency(dataPoint.value)}</p>
          <p className="text-slate-400 mt-0.5">{dataPoint.percentage}% of total portfolio</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Asset Allocation</h3>
          <p className="text-xs text-slate-400">Distribution by {viewMode === 'assetType' ? 'Asset Type' : 'Sector'}</p>
        </div>

        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('assetType')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'assetType' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Asset Type
          </button>
          <button
            onClick={() => setViewMode('sector')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'sector' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
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
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {chartData.slice(0, 6).map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <div className="truncate">
              <span className="font-medium text-slate-300 block truncate">{item.name}</span>
              <span className="text-[11px] text-slate-400 font-mono">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationPieChart;
