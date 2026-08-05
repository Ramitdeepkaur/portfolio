import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, Copy, TrendingUp } from 'lucide-react';
import api from '../api/client';
import CreateScenarioModal from '../components/CreateScenarioModal';
import { usePortfolio } from '../context/PortfolioContext';

const ScenariosPage = () => {
  const { holdings, summary } = usePortfolio();
  const [scenarios, setScenarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await api.getScenarios();
        setScenarios(data || []);
      } catch (err) {
        console.error('Unable to load scenarios', err);
      }
    };
    loadScenarios();
  }, []);

  const portfolioValue = useMemo(() => Number(summary?.totalPortfolioValue || 0), [summary]);

  const handleCreated = (scenario) => {
    setScenarios((prev) => [scenario, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Portfolio scenarios</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save what-if plans, forecasts, and retirement simulations for the current portfolio.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="h-4 w-4" /> New scenario
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {scenarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            No scenarios yet. Create your first forecast or what-if analysis.
          </div>
        ) : (
          scenarios.map((scenario) => (
            <div key={scenario.id} className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-400" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{scenario.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{scenario.description || 'No description provided.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">{scenario.scenarioType}</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-500/10 dark:text-emerald-300">Base value: ${Number(scenario.basePortfolioValue || portfolioValue).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" /> Ready for analysis</span>
                <span className="flex items-center gap-2"><Copy className="h-4 w-4 text-brand-400" /> Clone and compare later</span>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateScenarioModal
        isOpen={isModalOpen}
        scenarios={scenarios}
        holdings={holdings}
        portfolioValue={portfolioValue}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default ScenariosPage;
