import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import api from '../api/client';
import { RefreshCw, Plus, FileUp, Sun, Moon, ArrowRight } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1e] bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Brand Logo ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-dz-cyan/15 border border-dz-cyan/30 flex items-center justify-center flex-shrink-0">
            <span className="font-extrabold text-dz-cyan text-sm">F</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                FolioTrack
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-dz-cyan/10 text-dz-cyan border border-dz-cyan/30 rounded-full uppercase tracking-wider hidden sm:inline-block">
                PMS
              </span>
            </div>
          </div>
        </div>

        {/* ── Live Ticker Strip ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-1 mx-6 overflow-hidden items-center gap-0 px-4 py-1.5 rounded-full bg-[#121216] border border-[#27272a] max-w-lg">
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

        {/* ── Action Controls & White Pill CTA ────────────────────── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Refresh button */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="p-2 rounded-full border border-[#27272a] bg-[#121216] text-dz-muted hover:text-white hover:border-dz-border2 transition-all disabled:opacity-40"
            title="Refresh Market Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-dz-cyan' : ''}`} />
          </button>

          {/* CSV Import */}
          {onOpenCsvModal && (
            <button
              onClick={onOpenCsvModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#27272a] bg-[#121216] text-dz-muted hover:text-white hover:border-dz-border2 transition-all text-xs font-semibold"
            >
              <FileUp className="w-3.5 h-3.5 text-dz-cyan" />
              <span>CSV</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[#27272a] bg-[#121216] text-dz-muted hover:text-white hover:border-dz-border2 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-dz-cyan" /> : <Moon className="w-3.5 h-3.5 text-dz-muted" />}
          </button>

          {/* White Pill CTA button */}
          <button
            onClick={onOpenAddModal}
            className="btn-primary text-xs font-semibold px-4 sm:px-5 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Asset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;

