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

export const Navbar = ({ activeTab, setActiveTab, onOpenAddModal, onOpenCsvModal }) => {
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

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'holdings',     label: 'Holdings' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'audit',        label: 'Audit Trail' },
    { id: 'scenarios',    label: 'Scenarios' },
    { id: 'analytics',   label: 'Analytics' },
    { id: 'market',       label: 'Market Watch' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1e] bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

        {/* ── Brand Logo ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab && setActiveTab('dashboard')}>
          <span className="font-extrabold text-xl tracking-wider text-white uppercase font-sans">
            DEZERV
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold bg-dz-cyan/10 text-dz-cyan border border-dz-cyan/30 rounded-full uppercase tracking-widest hidden sm:inline-block">
            PMS
          </span>
        </div>

        {/* ── Top Navigation Links matching Dezerv UI ─────────────── */}
        {setActiveTab && (
          <nav className="hidden md:flex items-center gap-6 overflow-x-auto h-full text-xs font-medium text-dz-muted">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full flex items-center px-1 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-white text-white font-bold'
                      : 'border-transparent text-dz-muted hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* ── Action Controls & Primary CTA ──────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Refresh button */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="p-2 rounded-full border border-dz-border bg-dz-card text-dz-muted hover:text-white hover:border-dz-border2 transition-all disabled:opacity-40"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-dz-cyan' : ''}`} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-dz-border bg-dz-card text-dz-muted hover:text-white hover:border-dz-border2 transition-all"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-dz-cyan" /> : <Moon className="w-3.5 h-3.5 text-dz-muted" />}
          </button>

          {/* White Pill CTA button matching image `Book an expert call →` / `Add Asset →` */}
          <button
            onClick={onOpenAddModal}
            className="btn-primary text-xs font-semibold px-4 sm:px-5 py-2.5"
          >
            <span>Book an expert call</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;

