import React from 'react';
import { LayoutDashboard, Briefcase, BarChart3, LineChart, History, ShieldCheck, Sparkles } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'holdings',     label: 'Holdings',     icon: Briefcase },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'audit',        label: 'Audit Trail',  icon: ShieldCheck },
    { id: 'scenarios',    label: 'Scenarios',    icon: Sparkles },
    { id: 'analytics',   label: 'Analytics',    icon: BarChart3 },
    { id: 'market',       label: 'Market Watch', icon: LineChart },
  ];

  return (
    <aside className="w-full md:hidden flex-shrink-0 p-2.5 border-b border-[#1a1a1e] bg-black">
      <nav
        className="flex gap-1 overflow-x-auto pb-1"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-[#1c1c20] text-white border border-[#27272a]'
                  : 'text-dz-muted hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-dz-cyan' : 'text-dz-muted'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

