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
    <aside className="w-full md:w-56 flex-shrink-0 md:min-h-[calc(100vh-4rem)] md:sticky md:top-16 self-start p-2.5 md:p-4 border-b md:border-b-0 md:border-r border-dz-border bg-dz-black">
      <nav
        className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0"
        aria-label="Main navigation"
      >
        {/* Section label — desktop only */}
        <div className="hidden md:block px-2 py-2.5 text-[10px] font-semibold text-dz-muted uppercase tracking-widest">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
                transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink
                ${isActive
                  ? 'nav-active'
                  : 'text-dz-muted hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-dz-amber' : 'text-dz-bench'}`}
              />
              <span>{item.label}</span>
              {/* Active indicator dot — desktop only */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-dz-amber hidden md:block flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
