import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Eye, Briefcase } from 'lucide-react';
import api from '../api/client';

export const HoldingsTable = ({ holdings, onSell, onViewMarket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sortField, setSortField] = useState('currentValue');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterOptions, setFilterOptions] = useState({ assetTypes: [], sectors: [] });
  const [results, setResults] = useState(holdings || []);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const assetTypes = ['ALL', 'STOCKS', 'ETFS', 'MUTUAL_FUNDS', 'BONDS', 'CASH'];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await api.getFilterOptions();
        setFilterOptions({ assetTypes: options.assetTypes || [], sectors: options.sectors || [] });
      } catch (err) {
        console.error('Unable to load filter options', err);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    let mounted = true;
    const runQuery = async () => {
      setLoading(true);
      try {
        const criteria = {
          query: debouncedSearch || undefined,
          assetType: selectedType === 'ALL' ? undefined : selectedType,
          sector: selectedSector === 'ALL' ? undefined : selectedSector,
          sortBy: sortField,
          order: sortOrder.toUpperCase(),
          page: 0,
          size: 100,
        };
        const response = await api.searchHoldings(criteria);
        if (mounted) {
          setResults(response || []);
        }
      } catch (err) {
        if (mounted) {
          setResults((holdings || []).filter((h) => {
            const matchesSearch = !debouncedSearch || `${h.assetName} ${h.tickerSymbol} ${h.sector || ''}`.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesType = selectedType === 'ALL' || h.assetType?.toUpperCase() === selectedType;
            const matchesSector = selectedSector === 'ALL' || (h.sector || '').toUpperCase() === selectedSector;
            return matchesSearch && matchesType && matchesSector;
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    runQuery();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, selectedType, selectedSector, sortField, sortOrder, holdings]);

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

  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchTerm.trim()) filters.push(`Query: ${searchTerm.trim()}`);
    if (selectedType !== 'ALL') filters.push(`Type: ${selectedType}`);
    if (selectedSector !== 'ALL') filters.push(`Sector: ${selectedSector}`);
    return filters;
  }, [searchTerm, selectedType, selectedSector]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 text-brand-500 dark:text-brand-400" />
      : <ArrowDown className="w-3 h-3 text-brand-500 dark:text-brand-400" />;
  };

  const visibleHoldings = useMemo(() => {
    const source = Array.isArray(results) && results.length > 0 ? results : holdings || [];
    return [...source].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [results, holdings, sortField, sortOrder]);

  const getTypeBadge = (type) => {
    switch (type?.toUpperCase()) {
      case 'STOCKS':
        return 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20';
      case 'ETFS':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'MUTUAL_FUNDS':
        return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'BONDS':
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'CASH':
        return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Holdings Portfolio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage and track your active financial investments</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, ticker, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {assetTypes.map((type) => (
              <option key={type} value={type}>{type === 'ALL' ? 'All types' : type}</option>
            ))}
          </select>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="ALL">All sectors</option>
            {filterOptions.sectors.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('ALL');
              setSelectedSector('ALL');
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <span className="flex items-center gap-2">
              <X className="h-3.5 w-3.5" /> Clear
            </span>
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-950/50">
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active filters</span>
          {activeFilters.length === 0 ? (
            <span className="text-[11px] text-slate-400">No filters applied</span>
          ) : (
            activeFilters.map((filter) => (
              <span key={filter} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-300">
                {filter}
              </span>
            ))
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          {loading ? 'Refreshing results…' : `${visibleHoldings.length} holdings matched`}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3 w-[24%]">Asset</th>
              <th className="py-3 px-3 w-[11%]">Type</th>
              <th className="py-3 px-3 w-[7%] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" onClick={() => handleSort('quantity')}>
                <div className="flex items-center gap-1">
                  <span>Qty</span>
                  <SortIcon field="quantity" />
                </div>
              </th>
              <th className="py-3 px-3 w-[9%] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" onClick={() => handleSort('purchasePrice')}>
                <div className="flex items-center gap-1">
                  <span>Purchase Price</span>
                  <SortIcon field="purchasePrice" />
                </div>
              </th>
              <th className="py-3 px-3 w-[11%] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" onClick={() => handleSort('currentPrice')}>
                <div className="flex items-center gap-1">
                  <span>Cur. Price</span>
                  <SortIcon field="currentPrice" />
                </div>
              </th>
              <th className="py-3 px-3 w-[11%] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" onClick={() => handleSort('currentValue')}>
                <div className="flex items-center gap-1">
                  <span>Cur. Value</span>
                  <SortIcon field="currentValue" />
                </div>
              </th>
              <th className="py-3 px-3 w-[17%] cursor-pointer hover:text-slate-900 dark:hover:text-slate-200" onClick={() => handleSort('profitLoss')}>
                <div className="flex items-center gap-1">
                  <span>Unrealized P/L</span>
                  <SortIcon field="profitLoss" />
                </div>
              </th>
              <th className="py-3 px-3 w-[10%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/60 text-xs">
            {visibleHoldings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 px-4">
                  <div className="flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
                      <Briefcase className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {holdings?.length ? 'No holdings match your search' : 'No investment holdings yet'}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {holdings?.length
                          ? 'Try adjusting the search term or filter.'
                          : 'Add your first asset to start tracking your portfolio.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              visibleHoldings.map((holding) => {
                const isGain = holding.profitLoss >= 0;
                return (
                  <tr key={holding.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/60">
                    <td className="py-3 px-3 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs font-mono flex-shrink-0 dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-brand-600 dark:text-brand-400">{holding.tickerSymbol.substring(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{holding.assetName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 dark:text-slate-500">
                            <span>{holding.tickerSymbol}</span>
                            <span>•</span>
                            <span className="truncate">{holding.sector || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border block text-center truncate ${getTypeBadge(holding.assetType)}`}>
                        {holding.assetType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{holding.quantity}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{formatCurrency(holding.purchasePrice)}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(holding.currentPrice)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(holding.currentValue)}</td>
                    <td className="py-3 px-3 font-mono">
                      <div className={`flex items-center gap-1 font-semibold whitespace-nowrap ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isGain ? <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="truncate">{formatCurrency(holding.profitLoss)}</span>
                        <span className="text-[11px]">({isGain ? '+' : ''}{holding.profitPercentage}%)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => onViewMarket(holding.tickerSymbol)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors dark:hover:text-brand-400 dark:hover:bg-slate-900"
                          title="View Market History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                         {holding.assetType?.toUpperCase() !== 'CASH' && (
                           <button
                             onClick={() => onSell(holding)}
                             className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/40 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-600/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                             title="Sell Holding"
                             aria-label="Sell Holding"
                           >
                             SELL
                           </button>
                         )}
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
