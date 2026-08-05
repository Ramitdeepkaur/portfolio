import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import api from '../api/client';
import { TrendingUp, Sun, Moon, RefreshCw, Plus, FileUp } from 'lucide-react';

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
    if (unique.length >= 3) return unique.slice(0, 3);
    const defaults = ['AAPL', 'MSFT', 'NVDA'];
    return [...unique, ...defaults.filter((s) => !unique.includes(s))].slice(0, 3);
  }, [holdings]);

  useEffect(() => {
    let cancelled = false;
    api.getWatchlist(stripSymbols)
      .then((data) => {
        if (!cancelled) setTickerQuotes(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => {
        if (!cancelled) setTickerQuotes([]);
      });
    return () => { cancelled = true; };
  }, [stripSymbols, loading]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                FolioTrack
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 rounded-full">
                LIVE MARKET
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate">Portfolio Management System</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-xs dark:bg-slate-900/80 dark:border-slate-800">
          {tickerQuotes.length === 0 ? (
            <span className="text-slate-400 font-medium">Loading live quotes…</span>
          ) : (
            tickerQuotes.map((quote, index) => {
              const changePct = Number(quote.changePercentage || 0);
              const isGain = changePct >= 0;
              return (
                <React.Fragment key={quote.tickerSymbol}>
                  {index > 0 && <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{quote.tickerSymbol}</span>
                    <span className={`font-mono font-medium ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatPrice(quote.currentPrice)} ({formatPct(changePct)})
                    </span>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center disabled:opacity-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
            title="Refresh Market Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500 dark:text-brand-400' : ''}`} />
          </button>

          <button
            onClick={onOpenCsvModal}
            className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all text-xs font-semibold flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
          >
            <FileUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="hidden sm:inline">CSV Import/Export</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Asset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
