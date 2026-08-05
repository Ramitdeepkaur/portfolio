import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, Copy } from 'lucide-react';
import api from '../api/client';
import CreateScenarioModal from '../components/CreateScenarioModal';
import ScenarioDetailPanel from '../components/ScenarioDetailPanel';
import ScenarioComparisonChart from '../components/ScenarioComparisonChart';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, parseScenarioData, typeBadgeClasses } from '../utils/scenarioMath';

const ScenariosPage = () => {
  const { holdings, summary, showToast } = usePortfolio();
  const [scenarios, setScenarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  const loadScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setScenarios(data || []);
      if (selectedId && !(data || []).some((s) => s.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Unable to load scenarios', err);
      showToast?.('Unable to load scenarios', 'error');
    }
  };

  useEffect(() => {
    loadScenarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portfolioValue = useMemo(() => Number(summary?.totalPortfolioValue || 0), [summary]);
  const selected = scenarios.find((s) => s.id === selectedId) || null;
  const compareScenarios = scenarios
    .filter((s) => compareIds.includes(s.id))
    .map((s) => ({ ...s, data: parseScenarioData(s.data) }));

  const handleCreated = (scenario) => {
    setScenarios((prev) => [scenario, ...prev]);
    setSelectedId(scenario.id);
    setIsModalOpen(false);
    showToast?.('Scenario created with live portfolio snapshot');
  };

  const handleUpdated = (updated) => {
    setScenarios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleted = (id) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    setCompareIds((prev) => prev.filter((x) => x !== id));
    if (selectedId === id) setSelectedId(null);
    showToast?.('Scenario deleted');
  };

  const handleDuplicate = async (id) => {
    try {
      const copy = await api.duplicateScenario(id);
      setScenarios((prev) => [copy, ...prev]);
      setSelectedId(copy.id);
      showToast?.('Scenario duplicated');
    } catch {
      showToast?.('Failed to duplicate scenario', 'error');
    }
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5)));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Portfolio scenarios</h2>
            <p className="mt-1 text-sm text-slate-400">
              What-if overlays, growth forecasts, and retirement plans on a Yahoo-priced holdings snapshot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New scenario
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-3">
          {scenarios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
              No scenarios yet. Create one and clone your live portfolio to start.
            </div>
          ) : (
            scenarios.map((scenario) => {
              const parsed = parseScenarioData(scenario.data);
              const holdingCount = (parsed.baseHoldings || []).length;
              const active = selectedId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedId(scenario.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                    active
                      ? 'border-brand-500/50 bg-brand-500/10'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                        <h3 className="text-sm font-semibold text-slate-100 truncate">{scenario.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {scenario.description || 'No description'}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase ${typeBadgeClasses(scenario.scenarioType)}`}>
                      {scenario.scenarioType}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>{formatCurrency(scenario.basePortfolioValue)} · {holdingCount} holdings</span>
                    <span
                      role="checkbox"
                      aria-checked={compareIds.includes(scenario.id)}
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(scenario.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCompare(scenario.id);
                        }
                      }}
                      className={`rounded-full border px-2 py-0.5 cursor-pointer ${
                        compareIds.includes(scenario.id)
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 text-slate-500'
                      }`}
                    >
                      Compare
                    </span>
                  </div>
                  <div className="mt-2">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(scenario.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDuplicate(scenario.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-brand-200"
                    >
                      <Copy className="h-3 w-3" /> Duplicate
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8 space-y-4">
          {selected ? (
            <ScenarioDetailPanel
              scenario={selected}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
              Select a scenario to run what-if changes, forecasts, or retirement analysis.
            </div>
          )}

          {compareScenarios.length > 0 && (
            <ScenarioComparisonChart scenarios={compareScenarios} />
          )}
        </div>
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
