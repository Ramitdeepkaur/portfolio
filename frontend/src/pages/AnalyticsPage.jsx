import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import PerformanceAreaChart from '../components/PerformanceAreaChart';
import AllocationPieChart from '../components/AllocationPieChart';
import { TrendingUp, TrendingDown, Shield, Target, Award, Percent } from 'lucide-react';

export const AnalyticsPage = ({ onViewMarket }) => {
  const { performance, allocation, holdings } = usePortfolio();

  const sortedByGain = [...(holdings || [])].sort((a, b) => b.profitPercentage - a.profitPercentage);
  const topGainers = sortedByGain.slice(0, 5);
  const topLosers = [...sortedByGain].reverse().slice(0, 5);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">3-Year Est. CAGR</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 dark:text-emerald-400">
              +{performance?.cagr || 0}%
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Compounded Annual Growth Rate</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex-shrink-0 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Cumulative Return</span>
            <h3 className="text-2xl font-extrabold text-brand-600 font-mono mt-1 dark:text-brand-400">
              +{performance?.totalReturn || 0}%
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Overall Portfolio Growth</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex-shrink-0 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Portfolio Risk Profile</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 dark:text-slate-100">
              Balanced Growth
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Diversified across 5 Asset Classes</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex-shrink-0 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Gainers vs Losers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Top Performing Holdings</h3>
          </div>
          <div className="space-y-2.5">
            {topGainers.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-6">No holdings to display yet.</p>
            )}
            {topGainers.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewMarket(item.tickerSymbol)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-400/60 cursor-pointer transition-all dark:bg-slate-900/60 dark:border-slate-800/80 dark:hover:border-emerald-500/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold font-mono text-xs flex items-center justify-center border border-emerald-200 flex-shrink-0 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    {item.tickerSymbol.substring(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">{item.assetName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{item.tickerSymbol} • {item.sector}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-emerald-600 text-xs font-mono dark:text-emerald-400">+{item.profitPercentage}%</div>
                  <div className="text-[10px] text-slate-400">{formatCurrency(item.profitLoss)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <TrendingDown className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Bottom Performing Holdings</h3>
          </div>
          <div className="space-y-2.5">
            {topLosers.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-6">No holdings to display yet.</p>
            )}
            {topLosers.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewMarket(item.tickerSymbol)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-rose-400/60 cursor-pointer transition-all dark:bg-slate-900/60 dark:border-slate-800/80 dark:hover:border-rose-500/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-bold font-mono text-xs flex items-center justify-center border border-rose-200 flex-shrink-0 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                    {item.tickerSymbol.substring(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">{item.assetName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{item.tickerSymbol} • {item.sector}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-rose-600 text-xs font-mono dark:text-rose-400">{item.profitPercentage}%</div>
                  <div className="text-[10px] text-slate-400">{formatCurrency(item.profitLoss)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
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