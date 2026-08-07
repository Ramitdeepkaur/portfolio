import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TrendingUp, TrendingDown, Eye, LineChart, RefreshCw, Plus, X } from 'lucide-react';
import StockDetailModal from '../components/StockDetailModal';
import api from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';

const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatPct = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '0.0%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const MarketWatchPage = () => {
  const { holdings } = usePortfolio();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestBoxRef = useRef(null);
  const skipNextSearchRef = useRef(false);

  const holdingNames = useMemo(() => {
    const map = {};
    (holdings || []).forEach((h) => {
      if (h?.tickerSymbol) {
        map[h.tickerSymbol.toUpperCase()] = h.assetName || h.tickerSymbol;
      }
    });
    return map;
  }, [holdings]);

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPersistedWatchlist();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load watchlist', err);
      setError(err?.response?.data?.message || 'Could not load watchlist');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return undefined;
    }

    const q = newTicker.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setSuggestOpen(false);
      setSuggestLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSuggestLoading(true);
    setSuggestOpen(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchTickers(q, 8);
        if (!cancelled) {
          setSuggestions(Array.isArray(results) ? results : []);
          setSuggestOpen(true);
        }
      } catch (err) {
        console.error('Ticker search failed', err);
        if (!cancelled) {
          setSuggestions([]);
          setSuggestOpen(true);
          setError(err?.response?.data?.message || 'Ticker search failed — is the backend running?');
        }
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newTicker]);

  const pickSuggestion = (item) => {
    skipNextSearchRef.current = true;
    setNewTicker((item.symbol || '').toUpperCase());
    if (!newNotes.trim() && (item.shortName || item.longName)) {
      setNewNotes(item.shortName || item.longName);
    }
    setSuggestions([]);
    setSuggestOpen(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) return;
    setAdding(true);
    setError(null);
    setSuggestOpen(false);
    try {
      await api.addWatchlistItem({ tickerSymbol: ticker, notes: newNotes.trim() || undefined });
      setNewTicker('');
      setNewNotes('');
      setSuggestions([]);
      await loadWatchlist();
    } catch (err) {
      setError(err?.response?.data?.message || `Could not add ${ticker}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ticker, event) => {
    event.stopPropagation();
    setError(null);
    try {
      await api.removeWatchlistItem(ticker);
      setWatchlist((prev) => prev.filter((item) => item.tickerSymbol !== ticker));
    } catch (err) {
      setError(err?.response?.data?.message || `Could not remove ${ticker}`);
    }
  };

  const filteredWatchlist = watchlist.filter((item) => {
    const ticker = (item.tickerSymbol || '').toLowerCase();
    const name = (holdingNames[item.tickerSymbol] || item.notes || item.tickerSymbol || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return ticker.includes(q) || name.includes(q);
  });

  return (
    <div className="space-y-6 relative">
      {/* Keep search above watchlist cards (cards use transform/relative stacking) */}
      <div className="relative z-50 glass-card rounded-2xl p-6 flex flex-col gap-4 overflow-visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span>Watchlist</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search a company name or ticker, pick a suggestion, then add it — separate from holdings.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter saved ideas only…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={loadWatchlist}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-brand-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
              title="Refresh quotes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-2 overflow-visible">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Add idea — search Yahoo for ticker or company
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 overflow-visible">
            <div className="relative" ref={suggestBoxRef}>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                onFocus={() => (suggestions.length > 0 || suggestLoading) && setSuggestOpen(true)}
                placeholder="Type Apple, AAPL, Nvidia…"
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
              />
              {suggestOpen && (
                <div className="absolute left-0 right-0 z-[100] mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                  {suggestLoading && suggestions.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-500">Searching Yahoo for matching tickers…</p>
                  ) : suggestions.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-500">No matches. Try another company name or ticker.</p>
                  ) : (
                    suggestions.map((item) => (
                      <button
                        key={`${item.symbol}-${item.exchange || ''}`}
                        type="button"
                        onClick={() => pickSuggestion(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-500/10 border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400">
                            {[item.quoteType, item.exchange].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.shortName || item.longName || item.symbol}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional note (why you're watching)"
              className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={adding || !newTicker.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding…' : 'Add idea'}
            </button>
          </div>
        </form>
      </div>

      <div className="relative z-0">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 mb-6">
          {error}
        </div>
      )}

      {loading && watchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Loading watchlist…</p>
        </div>
      ) : filteredWatchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
            <LineChart className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {watchlist.length === 0 ? 'Your watchlist is empty' : 'No symbols match your filter'}
          </p>
          <p className="text-slate-400 text-xs">
            {watchlist.length === 0
              ? 'Add a ticker above to track an idea without buying it.'
              : 'Try a different ticker or clear the filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWatchlist.map((item) => {
            const changePct = Number(item.changePercentage || 0);
            const isGain = changePct >= 0;
            const name = holdingNames[item.tickerSymbol] || item.notes || 'Watching';
            return (
              <div
                key={item.id || item.tickerSymbol}
                onClick={() => setSelectedTicker(item.tickerSymbol)}
                className="glass-card rounded-2xl p-5 hover:border-brand-400/50 cursor-pointer transition-colors duration-300 group space-y-3"
              >
                <button
                  type="button"
                  onClick={(e) => handleRemove(item.tickerSymbol, e)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  title="Remove from watchlist"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-start justify-between gap-2 pr-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold flex items-center justify-center font-mono text-sm flex-shrink-0 transition-transform group-hover:scale-105 dark:bg-slate-900 dark:border-slate-800">
                      <span className="text-brand-600 dark:text-brand-400">{(item.tickerSymbol || '').substring(0, 3)}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {item.tickerSymbol}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{name}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${isGain ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{formatPct(changePct)}</span>
                  </span>
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Current Quote</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(item.currentPrice)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.inHoldings && (
                      <span className="text-[10px] uppercase tracking-wide rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                        In holdings
                      </span>
                    )}
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:text-white group-hover:bg-brand-600 transition-colors dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white dark:group-hover:bg-brand-600">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <StockDetailModal
        ticker={selectedTicker}
        isOpen={Boolean(selectedTicker)}
        onClose={() => setSelectedTicker(null)}
      />
    </div>
  );
};

export default MarketWatchPage;
