import React from 'react';
import { LayoutDashboard, Briefcase, BarChart3, LineChart, History, ShieldCheck, Sparkles } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'holdings', label: 'Holdings', icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'scenarios', label: 'Scenarios', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'market', label: 'Market Watch', icon: LineChart },
  ];

  return (
    <aside className="w-full md:w-60 flex-shrink-0 md:min-h-[calc(100vh-4rem)] md:sticky md:top-16 self-start p-3 md:p-4 border-b md:border-b-0 border-r-0 md:border-r border-slate-200/70 dark:border-slate-800/60 bg-slate-50/60 md:bg-transparent dark:bg-slate-950/40">
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0" aria-label="Main navigation">
        <div className="hidden md:block px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink ${
                isActive
                  ? 'bg-brand-50 text-brand-600 border border-brand-200 shadow-sm dark:bg-brand-600/15 dark:text-brand-400 dark:border-brand-500/30 dark:shadow-lg dark:shadow-brand-500/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
