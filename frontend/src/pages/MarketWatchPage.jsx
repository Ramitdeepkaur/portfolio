import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp, TrendingDown, Eye, LineChart, RefreshCw } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      const data = await api.getWatchlist();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load watchlist', err);
      setError('Could not load live market data');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const filteredWatchlist = watchlist.filter((item) => {
    const ticker = (item.tickerSymbol || '').toLowerCase();
    const name = (holdingNames[item.tickerSymbol] || item.tickerSymbol || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return ticker.includes(q) || name.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Market Watch & Historical Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live Yahoo Finance quotes via the portfolio API — OHLC, day change, and multi-period charts
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol..."
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

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && watchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Loading live quotes…</p>
        </div>
      ) : filteredWatchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
            <LineChart className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">No symbols match your search</p>
          <p className="text-slate-400 text-xs">Try a different ticker, or refresh the watchlist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWatchlist.map((item) => {
            const changePct = Number(item.changePercentage || 0);
            const isGain = changePct >= 0;
            const name = holdingNames[item.tickerSymbol] || item.tickerSymbol;
            return (
              <div
                key={item.tickerSymbol}
                onClick={() => setSelectedTicker(item.tickerSymbol)}
                className="glass-card rounded-2xl p-5 hover:border-brand-400/50 cursor-pointer transition-all duration-300 group space-y-3 hover:-translate-y-0.5 dark:hover:border-brand-500/50"
              >
                <div className="flex items-start justify-between gap-2">
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
                  <button type="button" className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:text-white group-hover:bg-brand-600 transition-colors dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white dark:group-hover:bg-brand-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StockDetailModal
        ticker={selectedTicker}
        isOpen={Boolean(selectedTicker)}
        onClose={() => setSelectedTicker(null)}
      />
    </div>
  );
};

export default MarketWatchPage;
