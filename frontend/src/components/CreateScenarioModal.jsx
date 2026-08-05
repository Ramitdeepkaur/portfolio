import React, { useEffect, useState } from 'react';
import { X, Sparkles, Copy, FolderTree } from 'lucide-react';
import api from '../api/client';
import { normalizeHolding, parseScenarioData, projectForecast, retirementAnalysis } from '../utils/scenarioMath';

const TYPE_OPTIONS = [
  { value: 'WHAT_IF', label: 'What-If Analysis', hint: 'Modify holdings and see portfolio impact' },
  { value: 'FORECAST', label: 'Forecast', hint: 'Projected growth with return/inflation assumptions' },
  { value: 'RETIREMENT', label: 'Retirement', hint: 'Plan toward a retirement savings target' },
];

export const CreateScenarioModal = ({ isOpen, scenarios = [], holdings = [], portfolioValue = 0, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioType, setScenarioType] = useState('WHAT_IF');
  const [duplicateFrom, setDuplicateFrom] = useState('');
  const [cloneCurrent, setCloneCurrent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setScenarioType('WHAT_IF');
      setDuplicateFrom('');
      setCloneCurrent(true);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const duplicating = Boolean(duplicateFrom);
  const effectiveType = duplicating
    ? scenarios.find((s) => String(s.id) === String(duplicateFrom))?.scenarioType
    : scenarioType;

  const snapshotHoldings = () => (holdings || []).map(normalizeHolding);

  const buildData = () => {
    if (duplicating) {
      const source = scenarios.find((s) => String(s.id) === String(duplicateFrom));
      return source ? { ...parseScenarioData(source.data) } : {};
    }

    const baseHoldings = cloneCurrent ? snapshotHoldings() : [];
    const baseValue = cloneCurrent
      ? baseHoldings.reduce((sum, h) => sum + Number(h.quantity || 0) * Number(h.currentPrice || 0), 0)
      : Number(portfolioValue || 0);

    if (scenarioType === 'WHAT_IF') {
      return {
        baseHoldings,
        changes: [],
        result: null,
        clonedFromPortfolio: cloneCurrent,
      };
    }

    if (scenarioType === 'FORECAST') {
      const params = {
        initialInvestment: baseValue || Number(portfolioValue || 0),
        annualReturn: 8,
        inflation: 2.5,
        volatility: 15,
        years: 20,
        monthlyContribution: 500,
      };
      const series = projectForecast(params);
      return { ...params, series, milestones: null, baseHoldings };
    }

    const retirementParams = {
      currentAge: 30,
      retirementAge: 60,
      currentSavings: baseValue || Number(portfolioValue || 0),
      annualReturn: 8,
      targetAmount: 1000000,
      currentMonthlyContribution: 500,
    };
    return {
      ...retirementParams,
      result: retirementAnalysis(retirementParams),
      baseHoldings,
    };
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please provide a scenario name.');
      return;
    }

    const source = duplicating ? scenarios.find((s) => String(s.id) === String(duplicateFrom)) : null;

    setSaving(true);
    setError('');
    try {
      // Refresh live Yahoo quotes before cloning so the snapshot uses current marks
      if (!duplicating && cloneCurrent) {
        try {
          await api.refreshMarket();
        } catch {
          // Continue with cached holdings prices
        }
      }

      const freshHoldings = !duplicating && cloneCurrent
        ? await api.getHoldings().catch(() => holdings)
        : holdings;

      // Temporarily swap holdings for build when we fetched fresh ones
      const dataPayload = (() => {
        if (duplicating) return buildData();
        const previous = holdings;
        // rebuild using freshHoldings
        const baseHoldings = cloneCurrent ? (freshHoldings || previous || []).map(normalizeHolding) : [];
        const baseValue = cloneCurrent
          ? baseHoldings.reduce((sum, h) => sum + Number(h.quantity || 0) * Number(h.currentPrice || 0), 0)
          : Number(portfolioValue || 0);

        if (scenarioType === 'WHAT_IF') {
          return {
            baseHoldings,
            changes: [],
            result: null,
            clonedFromPortfolio: cloneCurrent,
          };
        }
        if (scenarioType === 'FORECAST') {
          const params = {
            initialInvestment: baseValue || Number(portfolioValue || 0),
            annualReturn: 8,
            inflation: 2.5,
            volatility: 15,
            years: 20,
            monthlyContribution: 500,
          };
          return { ...params, series: projectForecast(params), milestones: null, baseHoldings };
        }
        const retirementParams = {
          currentAge: 30,
          retirementAge: 60,
          currentSavings: baseValue || Number(portfolioValue || 0),
          annualReturn: 8,
          targetAmount: 1000000,
          currentMonthlyContribution: 500,
        };
        return { ...retirementParams, result: retirementAnalysis(retirementParams), baseHoldings };
      })();

      const computedBase = (() => {
        const bh = dataPayload.baseHoldings || [];
        if (bh.length) {
          return bh.reduce((sum, h) => sum + Number(h.quantity || 0) * Number(h.currentPrice || 0), 0);
        }
        return Number(portfolioValue || 0);
      })();

      const payload = {
        name: name.trim(),
        description: duplicating
          ? description.trim() || `Duplicated from ${source?.name}`
          : description.trim(),
        scenarioType: effectiveType,
        basePortfolioValue: duplicating
          ? Number(source?.basePortfolioValue || portfolioValue || 0)
          : computedBase,
        data: JSON.stringify(dataPayload),
      };

      const created = await api.createScenario(payload);
      onCreated(created);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create scenario. Check the backend connection.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:placeholder-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800 dark:shadow-black/50">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between sticky top-0 bg-white z-10 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Create Scenario</h2>
              <p className="text-xs text-slate-400">Clone live holdings, then simulate what-if / forecast / retirement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:hover:text-white dark:hover:border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
              Scenario Name
            </label>
            <input
              className={inputClass}
              placeholder="e.g. Trim NVDA / Aggressive Growth"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
              Description
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Optional description of this scenario"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {!duplicating && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
                Scenario Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScenarioType(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      scenarioType === opt.value
                        ? 'bg-brand-600/15 border-brand-500/40 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[10px] mt-1 leading-tight">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
              Duplicate From Existing Scenario (optional)
            </label>
            <div className="relative">
              <Copy className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                className={`${inputClass} pl-9`}
                value={duplicateFrom}
                onChange={(e) => setDuplicateFrom(e.target.value)}
              >
                <option value="">Start fresh</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.scenarioType})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 dark:text-slate-500">
              {duplicating
                ? 'Type and data will be copied from the selected scenario. You can edit them after creation.'
                : 'Copy the assumptions and settings of an existing scenario as your starting point.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-100">
                  Clone current portfolio (live Yahoo prices)
                </p>
                <p className="text-[11px] text-slate-400">
                  {(holdings || []).length} holdings · ${Number(portfolioValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCloneCurrent((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                cloneCurrent ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title="Toggle clone current portfolio"
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                  cloneCurrent ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0 bg-white dark:border-slate-800 dark:bg-slate-950">
          <span className="text-[11px] text-slate-500">
            {effectiveType ? `New ${effectiveType.replaceAll('_', ' ')} scenario` : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-semibold transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Scenario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateScenarioModal;
