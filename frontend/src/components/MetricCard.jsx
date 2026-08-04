import React from 'react';

export const MetricCard = ({ title, value, change, isPositive, icon: Icon, color = 'brand', subtitle }) => {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getAccent = () => {
    switch (color) {
      case 'emerald': return 'text-emerald-600 dark:text-emerald-400';
      case 'rose': return 'text-rose-600 dark:text-rose-400';
      case 'amber': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-brand-600 dark:text-brand-400';
    }
  };

  const getGlow = () => {
    switch (color) {
      case 'emerald': return 'bg-gradient-to-bl from-emerald-400/25 via-emerald-400/5 to-transparent';
      case 'rose': return 'bg-gradient-to-bl from-rose-400/25 via-rose-400/5 to-transparent';
      case 'amber': return 'bg-gradient-to-bl from-amber-400/25 via-amber-400/5 to-transparent';
      default: return 'bg-gradient-to-bl from-brand-400/25 via-brand-400/5 to-transparent';
    }
  };

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/40 dark:hover:border-brand-400/30">
      <div className={`absolute top-0 right-0 w-32 h-32 ${getGlow()} rounded-full blur-2xl opacity-60 dark:opacity-50 pointer-events-none`} />

      <div className="flex items-start justify-between relative">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </h3>

          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {change !== undefined && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  }`}
                >
                  {isPositive ? '+' : ''}{change}%
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 dark:bg-slate-900/90 dark:border-slate-800`}>
            <Icon className={`w-5 h-5 ${getAccent()}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
