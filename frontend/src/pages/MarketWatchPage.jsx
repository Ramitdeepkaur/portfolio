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
  const [watchlist, setWatchlist]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');

  const holdingNames = useMemo(() => {
    const map = {};
    (holdings || []).forEach((h) => {
      if (h?.tickerSymbol) map[h.tickerSymbol.toUpperCase()] = h.assetName || h.tickerSymbol;
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
      setError('Could not load live market data');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const filteredWatchlist = watchlist.filter((item) => {
    const ticker = (item.tickerSymbol || '').toLowerCase();
    const name   = (holdingNames[item.tickerSymbol] || item.tickerSymbol || '').toLowerCase();
    const q      = searchQuery.toLowerCase();
    return ticker.includes(q) || name.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-dz-amber" />
            Market Watch
          </h2>
          <p className="text-xs text-dz-muted mt-0.5">
            Live Yahoo Finance quotes — OHLC, day change & multi-period charts
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-dz-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dz-input pl-9 w-full"
            />
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadWatchlist}
            disabled={loading}
            className="btn-secondary text-xs"
            title="Refresh quotes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-400"
          style={{ background: 'rgba(239,68,68,0.06)' }}>
          {error}
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && watchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-dz-amber animate-spin" />
          <p className="font-semibold text-white text-sm">Loading live quotes…</p>
        </div>
      ) : filteredWatchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-dz-dark border border-dz-border flex items-center justify-center">
            <LineChart className="w-6 h-6 text-dz-bench" />
          </div>
          <p className="font-semibold text-white text-sm">No symbols match your search</p>
          <p className="text-dz-muted text-xs">Try a different ticker or refresh.</p>
        </div>
      ) : (
        /* ── Ticker Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWatchlist.map((item) => {
            const changePct = Number(item.changePercentage || 0);
            const isGain    = changePct >= 0;
            const name      = holdingNames[item.tickerSymbol] || item.tickerSymbol;

            return (
              <div
                key={item.tickerSymbol}
                onClick={() => setSelectedTicker(item.tickerSymbol)}
                className="glass-card-hover rounded-2xl p-5 cursor-pointer group space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ticker icon */}
                    <div className="w-10 h-10 rounded-xl bg-dz-dark border border-dz-border font-bold flex items-center justify-center font-mono text-xs flex-shrink-0 group-hover:border-dz-border2 transition-colors">
                      <span className="text-dz-amber">{(item.tickerSymbol || '').substring(0, 3)}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-dz-amber transition-colors">
                        {item.tickerSymbol}
                      </h4>
                      <p className="text-[11px] text-dz-muted truncate">{name}</p>
                    </div>
                  </div>

                  {/* Change badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
                    isGain
                      ? 'bg-dz-green/10 text-dz-green2 border-dz-green/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPct(changePct)}
                  </span>
                </div>

                {/* Bottom row */}
                <div className="flex items-end justify-between pt-2.5 border-t border-dz-border">
                  <div>
                    <span className="text-[10px] text-dz-muted uppercase tracking-wider block">Quote</span>
                    <span className="text-lg font-bold text-white font-mono">
                      {formatCurrency(item.currentPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-dz-dark border border-dz-border text-dz-muted group-hover:text-white group-hover:border-dz-amber/30 group-hover:bg-dz-amber/10 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
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
