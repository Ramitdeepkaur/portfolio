import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import HoldingsTable from '../components/HoldingsTable';
import { Plus, FileUp } from 'lucide-react';

export const HoldingsPage = ({ onOpenAddModal, onOpenCsvModal, onEditHolding, onDeleteHolding, onViewMarket }) => {
  const { holdings, summary } = usePortfolio();

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* Holdings Header Summary */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Investment Holdings Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Invested: <span className="text-slate-200 font-semibold font-mono">{formatCurrency(summary?.totalInvestedAmount)}</span> | Current Portfolio Value: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(summary?.totalPortfolioValue)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCsvModal}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            <span>Import / Export</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      <HoldingsTable
        holdings={holdings}
        onEdit={onEditHolding}
        onDelete={onDeleteHolding}
        onViewMarket={onViewMarket}
      />
    </div>
  );
};

export default HoldingsPage;
