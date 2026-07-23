import React from 'react';
import { LayoutDashboard, Briefcase, BarChart3, LineChart, PieChart } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'holdings', label: 'Holdings', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'market', label: 'Market Watch', icon: LineChart },
  ];

  return (
    <aside className="w-full md:w-64 flex-shrink-0 md:min-h-[calc(100vh-4rem)] p-4 border-r border-slate-800/60 bg-slate-950/40">
      <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
