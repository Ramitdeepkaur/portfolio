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
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">3-Year Est. CAGR</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
              +{performance?.cagr || 0}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Compounded Annual Growth Rate</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Cumulative Return</span>
            <h3 className="text-2xl font-extrabold text-brand-400 font-mono mt-1">
              +{performance?.totalReturn || 0}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Overall Portfolio Growth</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Portfolio Risk Profile</span>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">
              Balanced Growth
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Diversified across 5 Asset Classes</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Gainers vs Losers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Top Performing Holdings</h3>
          </div>
          <div className="space-y-2.5">
            {topGainers.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewMarket(item.tickerSymbol)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center border border-emerald-500/20">
                    {item.tickerSymbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{item.assetName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.tickerSymbol} • {item.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400 text-xs font-mono">+{item.profitPercentage}%</div>
                  <div className="text-[10px] text-slate-400">{formatCurrency(item.profitLoss)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-slate-100">Bottom Performing Holdings</h3>
          </div>
          <div className="space-y-2.5">
            {topLosers.map((item) => (
              <div
                key={item.id}
                onClick={() => onViewMarket(item.tickerSymbol)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 font-bold font-mono text-xs flex items-center justify-center border border-rose-500/20">
                    {item.tickerSymbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{item.assetName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.tickerSymbol} • {item.sector}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-400 text-xs font-mono">{item.profitPercentage}%</div>
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
