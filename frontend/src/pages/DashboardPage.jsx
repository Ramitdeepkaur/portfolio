import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import MetricCard from '../components/MetricCard';
import AllocationPieChart from '../components/AllocationPieChart';
import PerformanceAreaChart from '../components/PerformanceAreaChart';
import HoldingsTable from '../components/HoldingsTable';
import DashboardWidgetShell from '../components/DashboardWidgetShell';
import DashboardCustomizer from '../components/DashboardCustomizer';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Wallet,
  Flame,
  AlertCircle,
  LayoutDashboard,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

const STORAGE_KEY = 'foliotrack:dashboard-layout:v1';

const DEFAULT_LAYOUT = [
  { id: 'metric-portfolio', title: 'Total Portfolio Value', enabled: true, span: 3 },
  { id: 'metric-pl', title: 'Total Profit / Loss', enabled: true, span: 3 },
  { id: 'metric-holdings', title: 'Active Holdings', enabled: true, span: 3 },
  { id: 'metric-cash', title: 'Cash Available', enabled: true, span: 3 },
  { id: 'performers', title: 'Top / Bottom Performers', enabled: true, span: 12 },
  { id: 'performance-chart', title: 'Portfolio Performance Curve', enabled: true, span: 7 },
  { id: 'allocation-chart', title: 'Asset Allocation', enabled: true, span: 5 },
  { id: 'holdings-table', title: 'Holdings Portfolio', enabled: true, span: 12 },
];

const loadLayout = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) {
      return DEFAULT_LAYOUT.map((def) => {
        const savedItem = saved.find((item) => item.id === def.id);
        return savedItem ? { ...def, ...savedItem } : def;
      });
    }
  } catch (err) {
    console.error('Failed to load dashboard layout', err);
  }
  return DEFAULT_LAYOUT;
};

export const DashboardPage = ({ onOpenAddModal, onEditHolding, onDeleteHolding, onViewMarket }) => {
  const { summary, holdings, allocation, performance, loading } = usePortfolio();
  const [layout, setLayout] = useState(loadLayout);
  const [customizing, setCustomizing] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
          <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  const isOverallGain = summary?.totalProfitLoss >= 0;

  const updateWidget = (id, patch) => {
    setLayout((prev) => prev.map((widget) => (widget.id === id ? { ...widget, ...patch } : widget)));
  };

  const toggleVisibility = (id) => {
    setLayout((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, enabled: !widget.enabled } : widget))
    );
  };

  const changeSpan = (id, span) => updateWidget(id, { span });

  const moveWidget = (id, direction) => {
    setLayout((prev) => {
      const from = prev.findIndex((w) => w.id === id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const resetLayout = () => setLayout(DEFAULT_LAYOUT);

  const handleDrop = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setLayout((prev) => {
      const from = prev.findIndex((w) => w.id === draggedId);
      const to = prev.findIndex((w) => w.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedId(null);
    setOverId(null);
  };

  const METRICS = {
    'metric-portfolio': {
      title: 'Total Portfolio Value',
      value: summary?.totalPortfolioValue || 0,
      change: summary?.todayPortfolioChangePercentage,
      isPositive: summary?.todayPortfolioChange >= 0,
      icon: DollarSign,
      color: 'brand',
      subtitle: "Today's Change",
    },
    'metric-pl': {
      title: 'Total Profit / Loss',
      value: summary?.totalProfitLoss || 0,
      change: summary?.profitLossPercentage,
      isPositive: isOverallGain,
      icon: TrendingUp,
      color: isOverallGain ? 'emerald' : 'rose',
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

  const renderPerformers = () =>
    summary?.bestPerformingAsset && summary?.worstPerformingAsset ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-emerald-400 font-semibold uppercase">Top Performing Asset</span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {summary.bestPerformingAsset.assetName} ({summary.bestPerformingAsset.tickerSymbol})
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-emerald-400 font-mono">
              +{summary.bestPerformingAsset.profitPercentage}%
            </span>
            <div className="text-xs text-slate-400">Gain: ${summary.bestPerformingAsset.profitLoss}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-rose-400 font-semibold uppercase">Lowest Performing Asset</span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {summary.worstPerformingAsset.assetName} ({summary.worstPerformingAsset.tickerSymbol})
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-rose-400 font-mono">
              {summary.worstPerformingAsset.profitPercentage}%
            </span>
            <div className="text-xs text-slate-400">P/L: ${summary.worstPerformingAsset.profitLoss}</div>
          </div>
        </div>
      </div>
    ) : null;

  const renderWidget = (widget) => {
    switch (widget.id) {
      case 'metric-portfolio':
      case 'metric-pl':
      case 'metric-holdings':
      case 'metric-cash': {
        const metric = METRICS[widget.id];
        return <MetricCard {...metric} />;
      }
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

  const visibleWidgets = layout.filter((widget) => widget.enabled);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {customizing
              ? 'Drag widgets to reorder them — your layout is saved automatically'
              : 'Personalize your dashboard: arrange, resize and hide widgets'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLayout}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all text-xs font-semibold flex items-center gap-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
            title="Reset dashboard layout to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => setCustomizing((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              customizing
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{customizing ? 'Done' : 'Customize'}</span>
            <span className="sm:hidden">Customize</span>
          </button>
        </div>
      </div>

      {visibleWidgets.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">All widgets are hidden</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-5 dark:text-slate-400">
            Open the dashboard customizer to bring widgets back to your view.
          </p>
          <button
            onClick={() => setCustomizing(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all"
          >
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
                onDragLeave={() => setOverId((prev) => (prev === widget.id ? null : prev))}
                onDrop={handleDrop}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverId(null);
                }}
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