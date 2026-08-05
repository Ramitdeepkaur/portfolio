import React from 'react';
import { X, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, GripVertical, LayoutGrid } from 'lucide-react';

const SPAN_OPTIONS = [
  { value: 3, label: '1/4 Width' },
  { value: 4, label: '1/3 Width' },
  { value: 6, label: '1/2 Width' },
  { value: 12, label: 'Full Width' },
];

export const DashboardCustomizer = ({
  isOpen,
  layout,
  onToggleVisibility,
  onChangeSpan,
  onMove,
  onReset,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 dark:bg-slate-950 dark:border-slate-800 dark:shadow-black/50">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Customize Dashboard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Arrange, resize and toggle your widgets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:text-white dark:hover:border-slate-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hint */}
        <div className="px-5 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-400">
            <GripVertical className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              Drag widgets directly on the dashboard to reorder them. Use the controls below to
              show/hide widgets and change their size.
            </span>
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {layout.map((widget, index) => (
            <div
              key={widget.id}
              className={`rounded-2xl border p-3.5 transition-all ${
                widget.enabled
                  ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-60 dark:bg-slate-900/30 dark:border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${widget.enabled ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {widget.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {widget.enabled ? 'Visible on dashboard' : 'Hidden from dashboard'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onMove(widget.id, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer dark:hover:text-slate-100 dark:hover:bg-slate-800"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onMove(widget.id, 1)}
                    disabled={index === layout.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer dark:hover:text-slate-100 dark:hover:bg-slate-800"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleVisibility(widget.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      widget.enabled
                        ? 'text-brand-400 hover:bg-brand-500/10'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                    }`}
                    title={widget.enabled ? 'Hide widget' : 'Show widget'}
                  >
                    {widget.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Size Selector */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 w-14">
                  Width
                </span>
                <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl flex-1 dark:bg-slate-950/80 dark:border-slate-800">
                  {SPAN_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onChangeSpan(widget.id, option.value)}
                      className={`flex-1 px-1.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                        widget.span === option.value
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex items-center justify-between gap-3 dark:border-slate-800">
          <button
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;
