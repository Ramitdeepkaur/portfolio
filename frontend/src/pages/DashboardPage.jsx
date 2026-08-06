import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import MetricCard from '../components/MetricCard';
import AllocationPieChart from '../components/AllocationPieChart';
import PerformanceAreaChart from '../components/PerformanceAreaChart';
import HoldingsTable from '../components/HoldingsTable';
import DashboardWidgetShell from '../components/DashboardWidgetShell';
import DashboardCustomizer from '../components/DashboardCustomizer';
import {
  DollarSign, TrendingUp, Briefcase, Wallet,
  Flame, AlertCircle, LayoutDashboard, RotateCcw, SlidersHorizontal,
} from 'lucide-react';

const STORAGE_KEY = 'foliotrack:dashboard-layout:v1';

const DEFAULT_LAYOUT = [
  { id: 'metric-portfolio', title: 'Total Portfolio Value',  enabled: true, span: 3 },
  { id: 'metric-pl',        title: 'Total Profit / Loss',    enabled: true, span: 3 },
  { id: 'metric-holdings',  title: 'Active Holdings',        enabled: true, span: 3 },
  { id: 'metric-cash',      title: 'Cash Available',         enabled: true, span: 3 },
  { id: 'performers',       title: 'Top / Bottom Performers',enabled: true, span: 12 },
  { id: 'performance-chart',title: 'Portfolio Performance',  enabled: true, span: 7 },
  { id: 'allocation-chart', title: 'Asset Allocation',       enabled: true, span: 5 },
  { id: 'holdings-table',   title: 'Holdings Portfolio',     enabled: true, span: 12 },
];

const loadLayout = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      return DEFAULT_LAYOUT.map((def) => {
        const s = saved.find((i) => i.id === def.id);
        return s ? { ...def, ...s } : def;
      });
    }
  } catch {}
  return DEFAULT_LAYOUT;
};

export const DashboardPage = ({ onOpenAddModal, onEditHolding, onDeleteHolding, onViewMarket }) => {
  const { summary, holdings, allocation, performance, loading } = usePortfolio();
  const [layout, setLayout]       = useState(loadLayout);
  const [customizing, setCustomizing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [overId, setOverId]       = useState(null);
  const [feeType, setFeeType]     = useState('fixed');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  /* ── Loading skeleton ── */
  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-dz-card border border-dz-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-dz-card border border-dz-border" />
          <div className="h-80 rounded-2xl bg-dz-card border border-dz-border" />
        </div>
      </div>
    );
  }

  const isOverallGain = (summary?.totalProfitLoss ?? 0) >= 0;

  const updateWidget    = (id, patch) =>
    setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  const toggleVisibility = (id) =>
    setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  const changeSpan = (id, span) => updateWidget(id, { span });
  const moveWidget = (id, dir) => {
    setLayout((prev) => {
      const from = prev.findIndex((w) => w.id === id);
      const to   = from + dir;
      if (from === -1 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const resetLayout = () => setLayout(DEFAULT_LAYOUT);
  const handleDrop  = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setLayout((prev) => {
      const from = prev.findIndex((w) => w.id === draggedId);
      const to   = prev.findIndex((w) => w.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedId(null);
    setOverId(null);
  };

  /* ── Metric definitions ── */
  const METRICS = {
    'metric-portfolio': {
      title: 'Total Portfolio Value',
      value: summary?.totalPortfolioValue || 0,
      change: summary?.todayPortfolioChangePercentage,
      isPositive: (summary?.todayPortfolioChange ?? 0) >= 0,
      icon: DollarSign,
      color: 'cyan',
      subtitle: "Today's Change",
      highlight: true,
    },
    'metric-pl': {
      title: 'Total Profit / Loss',
      value: summary?.totalProfitLoss || 0,
      change: summary?.profitLossPercentage,
      isPositive: isOverallGain,
      icon: TrendingUp,
      color: isOverallGain ? 'green' : 'rose',
      subtitle: 'Unrealized Return',
    },
    'metric-holdings': {
      title: 'Active Holdings',
      value: summary?.totalHoldings || 0,
      icon: Briefcase,
      color: 'cyan',
      subtitle: 'Assets Tracked',
    },
    'metric-cash': {
      title: 'Cash Available',
      value: summary?.cashAvailable || 0,
      icon: Wallet,
      color: 'emerald',
      subtitle: 'Liquid Reserve',
    },
  };

  return (
    <div className="space-y-8">

      {/* ── FolioTrack Main Hero Section ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            FolioTrack is one of the <span className="text-white font-black underline decoration-dz-cyan underline-offset-8">top PMS</span> in India
          </h1>
          <p className="text-sm text-dz-muted mt-2">
            Institutional portfolio management & wealth tracking built for smart investors.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="btn-primary flex-shrink-0 self-start md:self-auto text-sm font-semibold px-6 py-3"
        >
          <span className="text-black">🗓</span>
          <span>Book a free call</span>
        </button>
      </div>

      {/* ── Fee Model Comparative Section ───────────────────────────── */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-[#27272a]">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="w-12 h-12 rounded-full border border-dz-cyan/40 bg-dz-cyan/10 flex items-center justify-center text-dz-cyan text-xl font-bold">
            ₹
          </div>

          {/* Toggle pill button */}
          <div className="inline-flex p-1 bg-[#18181c] border border-[#27272a] rounded-full">
            <button
              onClick={() => setFeeType('fixed')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                feeType === 'fixed'
                  ? 'bg-[#27272a] text-white shadow-sm'
                  : 'text-dz-muted hover:text-white'
              }`}
            >
              Fixed Fee
            </button>
            <button
              onClick={() => setFeeType('hybrid')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                feeType === 'hybrid'
                  ? 'bg-[#27272a] text-white shadow-sm'
                  : 'text-dz-muted hover:text-white'
              }`}
            >
              Hybrid Fee
            </button>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            FolioTrack's {feeType === 'fixed' ? 'Fixed Fee' : 'Hybrid Fee'} Model
          </h2>

          <button
            onClick={onOpenAddModal}
            className="btn-primary text-xs sm:text-sm font-semibold px-5 py-2.5"
          >
            <span>🗓</span>
            <span>Schedule a call</span>
          </button>
        </div>

        {/* Right Column: Comparative Fee Breakdown */}
        <div className="lg:col-span-6 bg-[#09090b] rounded-2xl p-6 border border-[#27272a] space-y-6">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-white uppercase block mb-2 font-sans">
              FOLIOTRACK
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-dz-cyan tracking-tight font-sans">
                {feeType === 'fixed' ? '1%' : '0.5%'}
              </span>
              <span className="text-lg font-medium text-white">of your portfolio</span>
            </div>
            <p className="text-xs text-dz-muted mt-2">
              {feeType === 'fixed'
                ? 'i.e., 0.25% of AUM is charged at the end of every quarter.'
                : 'i.e., minimal performance fee charged only on returns above high-water mark.'}
            </p>
          </div>

          {/* VS Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[#27272a]"></div>
            <span className="absolute px-3 py-0.5 rounded-full bg-[#18181c] border border-[#27272a] text-[10px] font-bold text-dz-muted uppercase tracking-wider">
              vs
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-1">Traditional wealth firms</h4>
            <p className="text-xs text-dz-muted">
              Some PMS charge more than 2% of AUM as Fixed Fees
            </p>
            <div className="mt-4 text-right">
              <span className="text-xs text-dz-muted hover:text-white underline cursor-pointer">
                See how it works
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Header Controls ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#1a1a1e]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-dz-cyan/10 border border-dz-cyan/20">
              <LayoutDashboard className="w-4 h-4 text-dz-cyan" />
            </div>
            Portfolio Overview
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="btn-secondary text-xs"
            title="Reset layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={() => setCustomizing((p) => !p)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              customizing
                ? 'bg-white text-black shadow-md'
                : 'btn-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{customizing ? 'Done' : 'Customize'}</span>
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {visibleWidgets.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-dz-dark border border-dz-border flex items-center justify-center text-dz-bench mb-4">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">All widgets are hidden</h3>
          <p className="text-xs text-dz-muted mt-1.5 mb-5">Open the customizer to bring widgets back.</p>
          <button onClick={() => setCustomizing(true)} className="btn-primary text-xs">
            Customize Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {layout.map((widget) =>
            widget.enabled ? (
              <DashboardWidgetShell
                key={widget.id}
                id={widget.id}
                span={widget.span}
                editing={customizing}
                isDragging={draggedId === widget.id}
                isOver={overId === widget.id && draggedId !== widget.id}
                onDragStart={setDraggedId}
                onDragOver={setOverId}
                onDragLeave={() => setOverId((p) => (p === widget.id ? null : p))}
                onDrop={handleDrop}
                onDragEnd={() => { setDraggedId(null); setOverId(null); }}
                onHide={() => toggleVisibility(widget.id)}
              >
                {renderWidget(widget)}
              </DashboardWidgetShell>
            ) : null
          )}
        </div>
      )}

      <DashboardCustomizer
        isOpen={customizing}
        layout={layout}
        onToggleVisibility={toggleVisibility}
        onChangeSpan={changeSpan}
        onMove={moveWidget}
        onReset={resetLayout}
        onClose={() => setCustomizing(false)}
      />
    </div>
  );
};

export default DashboardPage;
