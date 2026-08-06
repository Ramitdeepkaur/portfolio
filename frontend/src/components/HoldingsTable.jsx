import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  Edit2, Trash2, Eye, Briefcase,
} from 'lucide-react';
import api from '../api/client';

export const HoldingsTable = ({ holdings, onEdit, onDelete, onViewMarket }) => {
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedType, setSelectedType]   = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sortField, setSortField]         = useState('currentValue');
  const [sortOrder, setSortOrder]         = useState('desc');
  const [filterOptions, setFilterOptions] = useState({ assetTypes: [], sectors: [] });
  const [results, setResults]             = useState(holdings || []);
  const [loading, setLoading]             = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const assetTypes = ['ALL', 'STOCKS', 'ETFS', 'MUTUAL_FUNDS', 'BONDS', 'CASH'];

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ── Load filter options ── */
  useEffect(() => {
    api.getFilterOptions()
      .then((opt) => setFilterOptions({ assetTypes: opt.assetTypes || [], sectors: opt.sectors || [] }))
      .catch(() => {});
  }, []);

  /* ── Server-side query ── */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const criteria = {
          query:     debouncedSearch || undefined,
          assetType: selectedType   === 'ALL' ? undefined : selectedType,
          sector:    selectedSector === 'ALL' ? undefined : selectedSector,
          sortBy:    sortField,
          order:     sortOrder.toUpperCase(),
          page: 0, size: 100,
        };
        const res = await api.searchHoldings(criteria);
        if (mounted) setResults(res || []);
      } catch {
        if (mounted) {
          setResults((holdings || []).filter((h) => {
            const matchSearch = !debouncedSearch ||
              `${h.assetName} ${h.tickerSymbol} ${h.sector || ''}`.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchType   = selectedType   === 'ALL' || h.assetType?.toUpperCase() === selectedType;
            const matchSector = selectedSector === 'ALL' || (h.sector || '').toUpperCase() === selectedSector;
            return matchSearch && matchType && matchSector;
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [debouncedSearch, selectedType, selectedSector, sortField, sortOrder, holdings]);

  const formatCurrency = (val) => {
    if (val == null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const activeFilters = useMemo(() => {
    const f = [];
    if (searchTerm.trim()) f.push(`"${searchTerm.trim()}"`);
    if (selectedType   !== 'ALL') f.push(selectedType);
    if (selectedSector !== 'ALL') f.push(selectedSector);
    return f;
  }, [searchTerm, selectedType, selectedSector]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortOrder === 'asc'
      ? <ArrowUp   className="w-3 h-3 text-dz-green2" />
      : <ArrowDown className="w-3 h-3 text-dz-green2" />;
  };

  const visibleHoldings = useMemo(() => {
    const src = Array.isArray(results) && results.length > 0 ? results : (holdings || []);
    return [...src].sort((a, b) => {
      const vA = a[sortField], vB = b[sortField];
      if (typeof vA === 'string') return sortOrder === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      return sortOrder === 'asc' ? vA - vB : vB - vA;
    });
  }, [results, holdings, sortField, sortOrder]);

  /* ── Type badge colours ── */
  const getTypeBadge = (type) => {
    switch (type?.toUpperCase()) {
      case 'STOCKS':       return 'bg-dz-green/10 text-dz-green2 border-dz-green/20';
      case 'ETFS':         return 'bg-dz-amber/10 text-dz-amber border-dz-amber/20';
      case 'MUTUAL_FUNDS': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'BONDS':        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'CASH':         return 'bg-dz-bench/20 text-dz-subtle border-dz-border';
      default:             return 'bg-dz-dark text-dz-muted border-dz-border';
    }
  };

  const thClass = 'py-3 px-3 text-[10px] font-semibold text-dz-muted uppercase tracking-wider';

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* ── Header & Controls ─────────────────────────────────── */}
      <div className="p-5 border-b border-dz-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Holdings Portfolio</h2>
          <p className="text-xs text-dz-muted mt-0.5">Manage and track your active investments</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-dz-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset, ticker, sector…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dz-input pl-9 w-full sm:w-60"
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="dz-select"
          >
            {assetTypes.map((t) => (
              <option key={t} value={t}>{t === 'ALL' ? 'All types' : t}</option>
            ))}
          </select>

          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="dz-select"
          >
            <option value="ALL">All sectors</option>
            {filterOptions.sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Clear */}
          <button
            onClick={() => { setSearchTerm(''); setSelectedType('ALL'); setSelectedSector('ALL'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dz-border bg-dz-dark text-dz-muted hover:text-white transition-colors text-xs"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* ── Active Filters Bar ──────────────────────────────────── */}
      <div className="border-b border-dz-border bg-dz-dark/40 px-5 py-2.5 flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-dz-muted">Filters</span>
          {activeFilters.length === 0
            ? <span className="text-[11px] text-dz-bench">None applied</span>
            : activeFilters.map((f) => (
              <span key={f} className="rounded-full border border-dz-amber/20 bg-dz-amber/8 px-2.5 py-0.5 text-[11px] text-dz-amber" style={{ background: 'rgba(226,135,97,0.08)' }}>
                {f}
              </span>
            ))
          }
        </div>
        <span className="text-[11px] text-dz-muted">
          {loading ? 'Refreshing…' : `${visibleHoldings.length} holdings`}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-dz-border bg-dz-dark/60 text-[10px] font-semibold text-dz-muted uppercase tracking-wider">
              <th className={`${thClass} w-[24%]`}>Asset</th>
              <th className={`${thClass} w-[11%]`}>Type</th>
              <th
                className={`${thClass} w-[7%] cursor-pointer hover:text-white`}
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center gap-1">Qty <SortIcon field="quantity" /></div>
              </th>
              <th
                className={`${thClass} w-[9%] cursor-pointer hover:text-white`}
                onClick={() => handleSort('purchasePrice')}
              >
                <div className="flex items-center gap-1">Avg Buy <SortIcon field="purchasePrice" /></div>
              </th>
              <th
                className={`${thClass} w-[11%] cursor-pointer hover:text-white`}
                onClick={() => handleSort('currentPrice')}
              >
                <div className="flex items-center gap-1">Cur. Price <SortIcon field="currentPrice" /></div>
              </th>
              <th
                className={`${thClass} w-[11%] cursor-pointer hover:text-white`}
                onClick={() => handleSort('currentValue')}
              >
                <div className="flex items-center gap-1">Value <SortIcon field="currentValue" /></div>
              </th>
              <th
                className={`${thClass} w-[17%] cursor-pointer hover:text-white`}
                onClick={() => handleSort('profitLoss')}
              >
                <div className="flex items-center gap-1">Unrealized P/L <SortIcon field="profitLoss" /></div>
              </th>
              <th className={`${thClass} w-[10%] text-right`}>Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-dz-border/60 text-xs">
            {visibleHoldings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 px-4">
                  <div className="flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-dz-card border border-dz-border flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-dz-bench" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {holdings?.length ? 'No holdings match your search' : 'No investment holdings yet'}
                      </p>
                      <p className="text-dz-muted text-xs mt-0.5">
                        {holdings?.length
                          ? 'Try adjusting the search term or filters.'
                          : 'Add your first asset to start tracking your portfolio.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              visibleHoldings.map((holding) => {
                const isGain = holding.profitLoss >= 0;
                const plPct  = holding.profitPercentage;
                return (
                  <tr key={holding.id} className="dz-row transition-colors">
                    {/* Asset */}
                    <td className="py-3.5 px-3 overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-dz-dark border border-dz-border flex items-center justify-center font-bold text-[11px] font-mono flex-shrink-0">
                          <span className="text-dz-amber">{holding.tickerSymbol.substring(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{holding.assetName}</div>
                          <div className="text-[11px] text-dz-muted font-mono flex items-center gap-1.5">
                            <span>{holding.tickerSymbol}</span>
                            <span className="text-dz-border2">·</span>
                            <span className="truncate">{holding.sector || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border block text-center truncate ${getTypeBadge(holding.assetType)}`}>
                        {holding.assetType}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 font-mono text-dz-subtle">{holding.quantity}</td>

                    {/* Avg Buy */}
                    <td className="py-3.5 px-3 font-mono text-dz-subtle">{formatCurrency(holding.purchasePrice)}</td>

                    {/* Current Price */}
                    <td className="py-3.5 px-3 font-mono text-white font-semibold">{formatCurrency(holding.currentPrice)}</td>

                    {/* Current Value */}
                    <td className="py-3.5 px-3 font-mono text-white font-semibold">{formatCurrency(holding.currentValue)}</td>

                    {/* P/L */}
                    <td className="py-3.5 px-3">
                      <div className={`font-mono font-bold text-xs ${isGain ? 'text-dz-green2' : 'text-rose-400'}`}>
                        {isGain ? '+' : ''}{formatCurrency(holding.profitLoss)}
                      </div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                        isGain
                          ? 'bg-dz-green/10 text-dz-green2 border border-dz-green/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {isGain ? '+' : ''}{plPct}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        {onViewMarket && (
                          <button
                            onClick={() => onViewMarket(holding.tickerSymbol)}
                            className="p-1.5 rounded-lg text-dz-muted hover:text-white hover:bg-dz-card transition-colors"
                            title="View Market"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(holding)}
                          className="p-1.5 rounded-lg text-dz-muted hover:text-dz-amber hover:bg-dz-amber/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(holding.id)}
                          className="p-1.5 rounded-lg text-dz-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete"
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
