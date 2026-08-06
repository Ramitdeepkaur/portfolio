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
      color: 'amber',
      subtitle: "Today's Change",
      highlight: true,            // amber glow border on the key metric
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
      color: 'amber',
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

  /* ── Performers panel ── */
  const renderPerformers = () =>
    summary?.bestPerformingAsset && summary?.worstPerformingAsset ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top performer */}
        <div className="p-4 rounded-2xl bg-dz-green/8 border border-dz-green/20 flex items-center justify-between"
          style={{ background: 'rgba(118,147,86,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dz-green/15 border border-dz-green/25">
              <Flame className="w-4 h-4 text-dz-green2" />
            </div>
            <div>
              <span className="text-[10px] text-dz-green2 font-semibold uppercase tracking-wider">Top Performer</span>
              <div className="font-bold text-white text-sm mt-0.5">
                {summary.bestPerformingAsset.assetName}
                <span className="text-dz-muted font-mono text-xs ml-1.5">
                  ({summary.bestPerformingAsset.tickerSymbol})
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-dz-green2 font-mono">
              +{summary.bestPerformingAsset.profitPercentage}%
            </div>
            <div className="text-[11px] text-dz-muted">${summary.bestPerformingAsset.profitLoss}</div>
          </div>
        </div>

        {/* Bottom performer */}
        <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20 flex items-center justify-between"
          style={{ background: 'rgba(239,68,68,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Lowest Performer</span>
              <div className="font-bold text-white text-sm mt-0.5">
                {summary.worstPerformingAsset.assetName}
                <span className="text-dz-muted font-mono text-xs ml-1.5">
                  ({summary.worstPerformingAsset.tickerSymbol})
                </span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-rose-400 font-mono">
              {summary.worstPerformingAsset.profitPercentage}%
            </div>
            <div className="text-[11px] text-dz-muted">${summary.worstPerformingAsset.profitLoss}</div>
          </div>
        </div>
      </div>
    ) : null;

  /* ── Widget renderer ── */
  const renderWidget = (widget) => {
    switch (widget.id) {
      case 'metric-portfolio':
      case 'metric-pl':
      case 'metric-holdings':
      case 'metric-cash':
        return <MetricCard {...METRICS[widget.id]} />;
      case 'performers':
        return renderPerformers();
      case 'performance-chart':
        return <PerformanceAreaChart performance={performance} />;
      case 'allocation-chart':
        return <AllocationPieChart allocation={allocation} />;
      case 'holdings-table':
        return (
          <HoldingsTable
            holdings={holdings}
            onEdit={onEditHolding}
            onDelete={onDeleteHolding}
            onViewMarket={onViewMarket}
          />
        );
      default:
        return null;
    }
  };

  const visibleWidgets = layout.filter((w) => w.enabled);

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-dz-amber/10 border border-dz-amber/20">
              <LayoutDashboard className="w-4 h-4 text-dz-amber" />
            </div>
            Dashboard Overview
          </h1>
          <p className="text-xs text-dz-muted mt-1">
            {customizing
              ? 'Drag widgets to reorder — layout is saved automatically'
              : 'Arrange, resize and hide widgets to personalise your view'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="btn-secondary text-xs"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={() => setCustomizing((p) => !p)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              customizing
                ? 'bg-dz-amber text-black shadow-amber-glow'
                : 'btn-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{customizing ? 'Done' : 'Customize'}</span>
            <span className="sm:hidden">Customize</span>
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
