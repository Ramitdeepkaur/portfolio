import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import api from '../api/client';
import { TrendingUp, RefreshCw, Plus, FileUp, Sun, Moon, ArrowRight } from 'lucide-react';

const formatPrice = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatPct = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '0.00%';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const Navbar = ({ onOpenAddModal, onOpenCsvModal }) => {
  const { theme, toggleTheme } = useTheme();
  const { holdings, refreshData, loading } = usePortfolio();
  const [tickerQuotes, setTickerQuotes] = useState([]);

  const stripSymbols = useMemo(() => {
    const fromHoldings = (holdings || [])
      .filter((h) => h?.tickerSymbol && String(h.assetType || '').toUpperCase() !== 'CASH')
      .map((h) => h.tickerSymbol.toUpperCase());
    const unique = [...new Set(fromHoldings)];
    if (unique.length >= 5) return unique.slice(0, 5);
    const defaults = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'];
    return [...unique, ...defaults.filter((s) => !unique.includes(s))].slice(0, 5);
  }, [holdings]);

  useEffect(() => {
    let cancelled = false;
    api.getWatchlist(stripSymbols)
      .then((data) => {
        if (!cancelled) setTickerQuotes(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(() => { if (!cancelled) setTickerQuotes([]); });
    return () => { cancelled = true; };
  }, [stripSymbols, loading]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-dz-border bg-dz-black/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Brand Mark ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-dz-amber flex items-center justify-center shadow-amber-glow flex-shrink-0">
            <TrendingUp className="w-4.5 h-4.5 text-black" style={{ width: 18, height: 18 }} />
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                FolioTrack
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-dz-green/15 text-dz-green2 border border-dz-green/30 rounded-full uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-[10px] text-dz-muted font-medium truncate">Wealth Management</p>
          </div>
        </div>

        {/* ── Live Ticker Strip ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-1 mx-6 overflow-hidden items-center gap-0 px-4 py-1.5 rounded-full bg-dz-card border border-dz-border max-w-lg">
          {tickerQuotes.length === 0 ? (
            <span className="text-dz-muted text-xs font-medium w-full text-center">Loading live quotes…</span>
          ) : (
            <div className="flex items-center gap-5 marquee-track whitespace-nowrap">
              {[...tickerQuotes, ...tickerQuotes].map((quote, index) => {
                const changePct = Number(quote.changePercentage || 0);
                const isGain = changePct >= 0;
                return (
                  <div key={`${quote.tickerSymbol}-${index}`} className="flex items-center gap-2">
                    <span className="font-semibold text-dz-subtle text-xs">{quote.tickerSymbol}</span>
                    <span className={`font-mono text-xs font-medium ${isGain ? 'text-dz-green2' : 'text-rose-400'}`}>
                      {formatPrice(quote.currentPrice)}
                    </span>
                    <span className={`text-[11px] font-semibold ${isGain ? 'text-dz-green2' : 'text-rose-400'}`}>
                      {formatPct(changePct)}
                    </span>
                    <span className="text-dz-border2 text-xs select-none">·</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Action Controls ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="p-2 rounded-full border border-dz-border bg-dz-card text-dz-muted hover:text-white hover:border-dz-border2 transition-all disabled:opacity-40"
            title="Refresh Market Data"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-dz-amber' : ''}`} />
          </button>

          {/* CSV Import/Export */}
          <button
            onClick={onOpenCsvModal}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border border-dz-border bg-dz-card text-dz-subtle hover:text-white hover:border-dz-border2 transition-all text-xs font-medium"
          >
            <FileUp className="w-3.5 h-3.5 text-dz-green2" />
            <span>CSV</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-dz-border bg-dz-card text-dz-muted hover:text-white hover:border-dz-border2 transition-all"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-dz-amber" />
              : <Moon className="w-4 h-4 text-dz-subtle" />
            }
          </button>

          {/* Primary CTA — white pill */}
          <button
            onClick={onOpenAddModal}
            className="btn-primary text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Asset</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
