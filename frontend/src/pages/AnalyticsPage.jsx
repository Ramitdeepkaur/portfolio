import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import PerformanceAreaChart from '../components/PerformanceAreaChart';
import AllocationPieChart from '../components/AllocationPieChart';
import { TrendingUp, TrendingDown, Shield, Target, Percent } from 'lucide-react';

export const AnalyticsPage = ({ onViewMarket }) => {
  const { performance, allocation, holdings } = usePortfolio();

  const sortedByGain = [...(holdings || [])].sort(
    (a, b) => b.profitPercentage - a.profitPercentage
  );
  const topGainers = sortedByGain.slice(0, 5);
  const topLosers  = [...sortedByGain].reverse().slice(0, 5);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  /* ── Stat card helper ── */
  const StatCard = ({ label, value, sub, Icon, iconClass, iconBg }) => (
    <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-[10px] font-semibold text-dz-muted uppercase tracking-widest">{label}</span>
        <h3 className="text-2xl font-extrabold text-white font-mono mt-1">{value}</h3>
        <p className="text-[11px] text-dz-muted mt-1">{sub}</p>
      </div>
      <div className={`p-3 rounded-xl border flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
    </div>
  );

  /* ── Performer row helper ── */
  const PerformerRow = ({ item, isGain }) => (
    <div
      onClick={() => onViewMarket(item.tickerSymbol)}
      className="flex items-center justify-between p-3 rounded-xl bg-dz-dark border border-dz-border hover:border-dz-border2 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg font-bold font-mono text-xs flex items-center justify-center border flex-shrink-0 ${
          isGain
            ? 'bg-dz-green/10 text-dz-green2 border-dz-green/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {item.tickerSymbol.substring(0, 3)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white text-xs truncate">{item.assetName}</div>
          <div className="text-[10px] text-dz-muted font-mono truncate">
            {item.tickerSymbol} · {item.sector}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <div className={`font-bold text-xs font-mono ${isGain ? 'text-dz-green2' : 'text-rose-400'}`}>
          {isGain ? '+' : ''}{item.profitPercentage}%
        </div>
        <div className="text-[10px] text-dz-muted">{formatCurrency(item.profitLoss)}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="3-Year Est. CAGR"
          value={`+${performance?.cagr || 0}%`}
          sub="Compounded Annual Growth Rate"
          Icon={Percent}
          iconClass="text-dz-green2"
          iconBg="bg-dz-green/10 border-dz-green/20"
        />
        <StatCard
          label="Total Cumulative Return"
          value={`+${performance?.totalReturn || 0}%`}
          sub="Overall Portfolio Growth"
          Icon={Target}
          iconClass="text-dz-amber"
          iconBg="bg-dz-amber/10 border-dz-amber/20"
        />
        <StatCard
          label="Portfolio Risk Profile"
          value="Balanced Growth"
          sub="Diversified across 5 Asset Classes"
          Icon={Shield}
          iconClass="text-dz-subtle"
          iconBg="bg-dz-bench/15 border-dz-border"
        />
      </div>

      {/* ── Gainers vs Losers ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-dz-border pb-3">
            <TrendingUp className="w-4 h-4 text-dz-green2" />
            <h3 className="font-bold text-white text-sm">Top Performing Holdings</h3>
          </div>
          <div className="space-y-2">
            {topGainers.length === 0 && (
              <p className="text-center text-xs text-dz-muted py-6">No holdings yet.</p>
            )}
            {topGainers.map((item) => (
              <PerformerRow key={item.id} item={item} isGain={true} />
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-dz-border pb-3">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Bottom Performing Holdings</h3>
          </div>
          <div className="space-y-2">
            {topLosers.length === 0 && (
              <p className="text-center text-xs text-dz-muted py-6">No holdings yet.</p>
            )}
            {topLosers.map((item) => (
              <PerformerRow key={item.id} item={item} isGain={false} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Visual Analytics ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PerformanceAreaChart performance={performance} />
        </div>
        <div className="lg:col-span-5">
          <AllocationPieChart allocation={allocation} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
