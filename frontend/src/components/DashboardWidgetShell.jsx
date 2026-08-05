import React from 'react';
import { GripVertical, EyeOff } from 'lucide-react';

const SPAN_CLASSES = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
};

export const DashboardWidgetShell = ({
  id,
  span = 12,
  editing = false,
  isDragging = false,
  isOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onHide,
  children,
}) => {
  const spanClass = SPAN_CLASSES[span] || 'lg:col-span-12';

  return (
    <div
      className={`col-span-12 sm:col-span-12 ${spanClass} relative transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-[0.98]' : ''
      } ${
        isOver
          ? 'ring-2 ring-brand-500/70 ring-offset-2 ring-offset-slate-950 rounded-2xl'
          : ''
      } ${editing ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        onDragStart(id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(id);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onDragLeave(id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(id);
      }}
      onDragEnd={onDragEnd}
    >
      {editing && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          <button
            onClick={onHide}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-400/40 transition-colors cursor-pointer dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:border-rose-500/40"
            title="Hide widget"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          <span className="px-2.5 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-slate-500 flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none text-[10px] font-semibold uppercase tracking-wider dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-400">
            <GripVertical className="w-3.5 h-3.5" />
            Drag
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

export default DashboardWidgetShell;
