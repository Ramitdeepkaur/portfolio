import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import HoldingsTable from '../components/HoldingsTable';
import HoldingHistoryPanel from '../components/HoldingHistoryPanel';
import { Plus, FileUp } from 'lucide-react';
import api from '../api/client';

export const HoldingsPage = ({ onOpenAddModal, onOpenCsvModal, onEditHolding, onDeleteHolding, onViewMarket }) => {
  const { holdings, summary } = usePortfolio();
  const [selectedHoldingId, setSelectedHoldingId] = useState(holdings[0]?.id || '');
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      const [txData, auditData] = await Promise.all([api.getTransactions(), api.getAuditLogs()]);
      setTransactions(txData);
      setAuditLogs(auditData);
    };
    loadHistory();
  }, [holdings]);

  const selectedHolding = holdings.find((holding) => holding.id === selectedHoldingId) || holdings[0] || null;

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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Holding history snapshot</h3>
            <p className="text-sm text-slate-400">Inspect recent transactions and audit events for the selected position.</p>
          </div>
          <select value={selectedHoldingId} onChange={(e) => setSelectedHoldingId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
            {holdings.map((holding) => (
              <option key={holding.id} value={holding.id}>
                {holding.tickerSymbol || holding.assetName}
              </option>
            ))}
          </select>
        </div>
        <HoldingHistoryPanel holding={selectedHolding} transactions={transactions} auditLogs={auditLogs} />
      </div>
    </div>
  );
};

export default HoldingsPage;
