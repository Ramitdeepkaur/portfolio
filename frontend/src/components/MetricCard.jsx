import React from 'react';

export const MetricCard = ({ title, value, change, isPositive, icon: Icon, color = 'brand', subtitle }) => {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getGradient = () => {
    switch (color) {
      case 'emerald': return 'from-emerald-500/20 via-emerald-500/5 to-transparent text-emerald-400 border-emerald-500/30';
      case 'rose': return 'from-rose-500/20 via-rose-500/5 to-transparent text-rose-400 border-rose-500/30';
      case 'amber': return 'from-amber-500/20 via-amber-500/5 to-transparent text-amber-400 border-amber-500/30';
      default: return 'from-brand-500/20 via-brand-500/5 to-transparent text-brand-400 border-brand-500/30';
    }
  };

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:border-slate-700">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${getGradient()} rounded-full blur-2xl opacity-50 pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </h3>

          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2">
              {change !== undefined && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {isPositive ? '+' : ''}{change}%
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
