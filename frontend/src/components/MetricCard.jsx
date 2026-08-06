import React from 'react';

/**
 * Dezerv-styled KPI card.
 * Props:
 *   title      — label string
 *   value      — number (rendered as currency) or string (rendered as-is)
 *   change     — optional ± percentage number
 *   isPositive — boolean controls green/red badge
 *   icon       — Lucide icon component
 *   color      — 'brand' | 'emerald' | 'rose' | 'amber' | 'green'
 *   subtitle   — secondary label under the badge
 *   highlight  — boolean: render with amber glow border (key metric callout)
 */
export const MetricCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  color = 'brand',
  subtitle,
  highlight = false,
}) => {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  /* Icon accent colour */
  const iconColor = () => {
    switch (color) {
      case 'green':   return 'text-dz-green2';
      case 'emerald': return 'text-emerald-400';
      case 'rose':    return 'text-rose-400';
      case 'cyan':    return 'text-dz-cyan';
      default:        return 'text-dz-cyan';
    }
  };

  /* Icon background ring */
  const iconBg = () => {
    switch (color) {
      case 'green':   return 'bg-dz-green/10 border-dz-green/20';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'rose':    return 'bg-rose-500/10 border-rose-500/20';
      case 'cyan':    return 'bg-dz-cyan/10 border-dz-cyan/20';
      default:        return 'bg-dz-cyan/10 border-dz-cyan/20';
    }
  };

  /* Corner glow */
  const glowClass = () => {
    switch (color) {
      case 'green':   return 'from-dz-green/20 via-dz-green/5';
      case 'emerald': return 'from-emerald-500/20 via-emerald-500/5';
      case 'rose':    return 'from-rose-500/20 via-rose-500/5';
      case 'cyan':    return 'from-dz-cyan/20 via-dz-cyan/5';
      default:        return 'from-dz-cyan/20 via-dz-cyan/5';
    }
  };

  const cardClass = highlight
    ? 'highlight-card relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5'
    : 'glass-card relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-dz-border2';

  return (
    <div className={cardClass}>
      {/* Corner gradient glow */}
      <div
        className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${glowClass()} to-transparent rounded-full blur-2xl opacity-70 pointer-events-none`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-dz-muted uppercase tracking-widest truncate">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight mt-1 truncate">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </h3>

          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {change !== undefined && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isPositive
                      ? 'bg-dz-green/10 text-dz-green2 border-dz-green/25'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {isPositive ? '+' : ''}{change}%
                </span>
              )}
              {subtitle && (
                <span className="text-[10px] text-dz-muted">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg()}`}>
            <Icon className={`w-5 h-5 ${iconColor()}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
