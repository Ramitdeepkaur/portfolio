import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Edit2, Trash2, TrendingUp, TrendingDown, Eye } from 'lucide-react';

export const HoldingsTable = ({ holdings, onEdit, onDelete, onViewMarket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortField, setSortField] = useState('currentValue');
  const [sortOrder, setSortOrder] = useState('desc');

  const assetTypes = ['ALL', 'STOCKS', 'ETFS', 'MUTUAL_FUNDS', 'BONDS', 'CASH'];

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredHoldings = (holdings || []).filter((h) => {
    const matchesSearch =
      h.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.tickerSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.sector && h.sector.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'ALL' || h.assetType?.toUpperCase() === selectedType;
    return matchesSearch && matchesType;
  });

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const getTypeBadge = (type) => {
    switch (type?.toUpperCase()) {
      case 'STOCKS':
        return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
      case 'ETFS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MUTUAL_FUNDS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'BONDS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CASH':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Holdings Portfolio</h2>
          <p className="text-xs text-slate-400">Manage and track your active financial investments</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, ticker, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {assetTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Asset</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('quantity')}>
                <div className="flex items-center gap-1">
                  <span>Qty</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('purchasePrice')}>
                <div className="flex items-center gap-1">
                  <span>Avg Buy</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('currentPrice')}>
                <div className="flex items-center gap-1">
                  <span>Current Price</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('currentValue')}>
                <div className="flex items-center gap-1">
                  <span>Current Value</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('profitLoss')}>
                <div className="flex items-center gap-1">
                  <span>Unrealized P/L</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {sortedHoldings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No investment holdings found.
                </td>
              </tr>
            ) : (
              sortedHoldings.map((holding) => {
                const isGain = holding.profitLoss >= 0;
                return (
                  <tr key={holding.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-brand-400 font-mono">
                          {holding.tickerSymbol.substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{holding.assetName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                            <span>{holding.tickerSymbol}</span>
                            <span>•</span>
                            <span>{holding.sector || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getTypeBadge(holding.assetType)}`}>
                        {holding.assetType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{holding.quantity}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{formatCurrency(holding.purchasePrice)}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">{formatCurrency(holding.currentPrice)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{formatCurrency(holding.currentValue)}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className={`flex items-center gap-1 font-semibold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{formatCurrency(holding.profitLoss)}</span>
                        <span className="text-[11px]">({isGain ? '+' : ''}{holding.profitPercentage}%)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewMarket(holding.tickerSymbol)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-900 transition-colors"
                          title="View Market History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(holding)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors"
                          title="Edit Holding"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(holding.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                          title="Delete Holding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoldingsTable;
