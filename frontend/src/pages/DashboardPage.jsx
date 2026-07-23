import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import MetricCard from '../components/MetricCard';
import AllocationPieChart from '../components/AllocationPieChart';
import PerformanceAreaChart from '../components/PerformanceAreaChart';
import HoldingsTable from '../components/HoldingsTable';
import { DollarSign, TrendingUp, Briefcase, Wallet, Flame, AlertCircle } from 'lucide-react';

export const DashboardPage = ({ onOpenAddModal, onEditHolding, onDeleteHolding, onViewMarket }) => {
  const { summary, holdings, allocation, performance, loading } = usePortfolio();

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800" />
          <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800" />
        </div>
      </div>
    );
  }

  const isOverallGain = summary?.totalProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Portfolio Value"
          value={summary?.totalPortfolioValue || 0}
          change={summary?.todayPortfolioChangePercentage}
          isPositive={summary?.todayPortfolioChange >= 0}
          icon={DollarSign}
          color="brand"
          subtitle="Today's Change"
        />

        <MetricCard
          title="Total Profit / Loss"
          value={summary?.totalProfitLoss || 0}
          change={summary?.profitLossPercentage}
          isPositive={isOverallGain}
          icon={TrendingUp}
          color={isOverallGain ? 'emerald' : 'rose'}
          subtitle="Unrealized Return"
        />

        <MetricCard
          title="Active Holdings"
          value={summary?.totalHoldings || 0}
          icon={Briefcase}
          color="amber"
          subtitle="Assets Tracked"
        />

        <MetricCard
          title="Cash Available"
          value={summary?.cashAvailable || 0}
          icon={Wallet}
          color="emerald"
          subtitle="Liquid Reserve"
        />
      </div>

      {/* Top Performers Highlights Banner */}
      {summary?.bestPerformingAsset && summary?.worstPerformingAsset && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase">Top Performing Asset</span>
                <div className="font-bold text-slate-100 text-sm">{summary.bestPerformingAsset.assetName} ({summary.bestPerformingAsset.tickerSymbol})</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-emerald-400 font-mono">+{summary.bestPerformingAsset.profitPercentage}%</span>
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
                <div className="font-bold text-slate-100 text-sm">{summary.worstPerformingAsset.assetName} ({summary.worstPerformingAsset.tickerSymbol})</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-rose-400 font-mono">{summary.worstPerformingAsset.profitPercentage}%</span>
              <div className="text-xs text-slate-400">P/L: ${summary.worstPerformingAsset.profitLoss}</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PerformanceAreaChart performance={performance} />
        </div>
        <div className="lg:col-span-5">
          <AllocationPieChart allocation={allocation} />
        </div>
      </div>

      {/* Holdings Table Section */}
      <HoldingsTable
        holdings={holdings}
        onEdit={onEditHolding}
        onDelete={onDeleteHolding}
        onViewMarket={onViewMarket}
      />
    </div>
  );
};

export default DashboardPage;
