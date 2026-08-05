import React, { useEffect, useMemo, useState } from 'react';
import {
  Save,
  Trash2,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import api from '../api/client';
import {
  applyWhatIfChanges,
  assessRisk,
  formatCurrency,
  parseScenarioData,
  projectForecast,
  retirementAnalysis,
  runMonteCarlo,
  typeBadgeClasses,
} from '../utils/scenarioMath';

const inputClass =
  'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500';

const Metric = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p
      className={`mt-1 text-sm font-semibold font-mono ${
        tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-slate-100'
      }`}
    >
      {tone === 'up' && <TrendingUp className="inline h-3.5 w-3.5 mr-1" />}
      {tone === 'down' && <TrendingDown className="inline h-3.5 w-3.5 mr-1" />}
      {value}
    </p>
  </div>
);

const Field = ({ label, value, onChange, type = 'text' }) => (
  <label className="block text-xs text-slate-400">
    <span className="mb-1 block font-semibold uppercase tracking-wide">{label}</span>
    <input className={inputClass} type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  </label>
);

/** Merge pending qty input boxes into change list (same ticker replaces prior QUANTITY). */
const mergeQtyEditsIntoChanges = (baseData, edits) => {
  let changes = [...(baseData.changes || [])];
  (baseData.baseHoldings || []).forEach((h) => {
    const raw = edits[h.tickerSymbol];
    if (raw === undefined || raw === '') return;
    const quantity = Number(raw);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    if (Number(quantity) === Number(h.quantity)) {
      changes = changes.filter(
        (c) => !(c.op === 'QUANTITY' && String(c.tickerSymbol).toUpperCase() === h.tickerSymbol),
      );
      return;
    }
    changes = changes.filter(
      (c) => !(c.op === 'QUANTITY' && String(c.tickerSymbol).toUpperCase() === h.tickerSymbol),
    );
    changes.push({
      op: 'QUANTITY',
      holdingId: h.holdingId,
      tickerSymbol: h.tickerSymbol,
      quantity,
    });
  });
  return { ...baseData, changes };
};

export const ScenarioDetailPanel = ({ scenario, onUpdated, onDeleted }) => {
  const [data, setData] = useState(() => parseScenarioData(scenario?.data));
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState('');
  const [qtyEdits, setQtyEdits] = useState({});
  const [addForm, setAddForm] = useState({
    tickerSymbol: '',
    quantity: '1',
    price: '',
    assetName: '',
  });

  useEffect(() => {
    setData(parseScenarioData(scenario?.data));
    setMessage('');
    setQtyEdits({});
  }, [scenario?.id, scenario?.data]);

  const effectiveWhatIfData = useMemo(() => {
    if (scenario?.scenarioType !== 'WHAT_IF') return data;
    return mergeQtyEditsIntoChanges(data, qtyEdits);
  }, [scenario?.scenarioType, data, qtyEdits]);

  const whatIfResult = useMemo(() => {
    if (scenario?.scenarioType !== 'WHAT_IF') return null;
    return applyWhatIfChanges(
      effectiveWhatIfData.baseHoldings || [],
      effectiveWhatIfData.changes || [],
    );
  }, [scenario?.scenarioType, effectiveWhatIfData]);

  const projectedByTicker = useMemo(() => {
    const map = {};
    (whatIfResult?.projected?.per || []).forEach((row) => {
      map[row.tickerSymbol] = row;
    });
    return map;
  }, [whatIfResult]);

  const forecastSeries = useMemo(() => {
    if (scenario?.scenarioType !== 'FORECAST') return null;
    return projectForecast(data);
  }, [scenario?.scenarioType, data]);

  const monteCarlo = useMemo(() => {
    if (scenario?.scenarioType !== 'FORECAST') return null;
    return runMonteCarlo({ ...data, simulations: 400 });
  }, [scenario?.scenarioType, data]);

  const retirement = useMemo(() => {
    if (scenario?.scenarioType !== 'RETIREMENT') return null;
    return retirementAnalysis(data);
  }, [scenario?.scenarioType, data]);

  const persist = async (nextData) => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateScenario(scenario.id, {
        name: scenario.name,
        description: scenario.description,
        scenarioType: scenario.scenarioType,
        basePortfolioValue: scenario.basePortfolioValue,
        data: JSON.stringify(nextData),
      });
      setData(parseScenarioData(updated.data));
      setQtyEdits({});
      onUpdated?.(updated);
      const result = parseScenarioData(updated.data)?.result;
      if (result?.deltas) {
        setMessage(
          `Saved. Projected value ${formatCurrency(result.projected?.value)} (${result.deltas.pct >= 0 ? '+' : ''}${result.deltas.pct}% vs base). This does not change your real holdings.`,
        );
      } else {
        setMessage('Scenario saved');
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveComputed = async () => {
    let next = { ...data };
    if (scenario.scenarioType === 'WHAT_IF') {
      next = mergeQtyEditsIntoChanges(data, qtyEdits);
      const result = applyWhatIfChanges(next.baseHoldings || [], next.changes || []);
      next = { ...next, result };
      setData(next);
    } else if (scenario.scenarioType === 'FORECAST') {
      next = { ...next, series: forecastSeries, monteCarlo, risk: assessRisk(data.volatility) };
    } else if (scenario.scenarioType === 'RETIREMENT') {
      next = { ...next, result: retirement };
    }
    await persist(next);
  };

  const updateField = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

  const upsertChange = (change) => {
    setData((prev) => {
      const ticker = (change.tickerSymbol || '').toUpperCase();
      let changes = [...(prev.changes || [])];
      if (change.op === 'QUANTITY' || change.op === 'PRICE' || change.op === 'REMOVE') {
        changes = changes.filter(
          (c) =>
            !(
              c.op === change.op &&
              (String(c.tickerSymbol || '').toUpperCase() === ticker ||
                (change.holdingId != null && String(c.holdingId) === String(change.holdingId)))
            ),
        );
      }
      changes.push({ ...change, tickerSymbol: ticker || change.tickerSymbol });
      return { ...prev, changes };
    });
    if (change.op === 'QUANTITY') {
      setMessage(`Quantity for ${change.tickerSymbol} set to ${change.quantity}. Click Save results to persist.`);
    }
  };

  const addChange = upsertChange;

  const removeChange = (index) => {
    setData((prev) => ({
      ...prev,
      changes: (prev.changes || []).filter((_, i) => i !== index),
    }));
  };

  const lookupAddTicker = async () => {
    const ticker = addForm.tickerSymbol.trim().toUpperCase();
    if (!ticker) return;
    setLookingUp(true);
    try {
      const quote = await api.getMarketData(ticker);
      setAddForm((prev) => ({
        ...prev,
        tickerSymbol: ticker,
        price: String(quote.currentPrice ?? ''),
        assetName: prev.assetName || ticker,
      }));
    } catch {
      setMessage(`Could not fetch live price for ${ticker}`);
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddHoldingChange = async () => {
    const ticker = addForm.tickerSymbol.trim().toUpperCase();
    if (!ticker || !Number(addForm.quantity)) {
      setMessage('Ticker and quantity are required');
      return;
    }
    let price = Number(addForm.price);
    if (!price) {
      try {
        const quote = await api.getMarketData(ticker);
        price = Number(quote.currentPrice || 0);
      } catch {
        setMessage(`Could not fetch live price for ${ticker}`);
        return;
      }
    }
    addChange({
      op: 'ADD',
      tickerSymbol: ticker,
      assetName: addForm.assetName || ticker,
      quantity: Number(addForm.quantity),
      price,
      purchasePrice: price,
    });
    setAddForm({ tickerSymbol: '', quantity: '1', price: '', assetName: '' });
  };

  const refreshBasePrices = async () => {
    setLookingUp(true);
    setMessage('');
    try {
      await api.refreshMarket();
      const live = await api.getHoldings();
      const byTicker = Object.fromEntries(
        (live || []).map((h) => [String(h.tickerSymbol).toUpperCase(), h]),
      );
      const refreshed = (data.baseHoldings || []).map((h) => {
        const liveH = byTicker[h.tickerSymbol];
        if (!liveH) return h;
        return {
          ...h,
          currentPrice: Number(liveH.currentPrice || h.currentPrice),
          quantity: Number(liveH.quantity ?? h.quantity),
          purchasePrice: Number(liveH.purchasePrice ?? h.purchasePrice),
        };
      });
      setData((prev) => ({ ...prev, baseHoldings: refreshed }));
      setMessage('Base holdings repriced from Yahoo');
    } catch {
      setMessage('Failed to refresh base prices');
    } finally {
      setLookingUp(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete scenario "${scenario.name}"?`)) return;
    await api.deleteScenario(scenario.id);
    onDeleted?.(scenario.id);
  };

  if (!scenario) return null;

  const risk = assessRisk(data.volatility);
  const forecastLast = forecastSeries?.[forecastSeries.length - 1];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-100">{scenario.name}</h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs uppercase ${typeBadgeClasses(scenario.scenarioType)}`}>
              {scenario.scenarioType}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{scenario.description || 'No description'}</p>
          <p className="mt-1 text-xs text-slate-500">
            Base: {formatCurrency(scenario.basePortfolioValue)} · {(data.baseHoldings || []).length} holdings snapshotted
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenario.scenarioType === 'WHAT_IF' && (
            <button
              type="button"
              onClick={refreshBasePrices}
              disabled={lookingUp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${lookingUp ? 'animate-spin' : ''}`} />
              Refresh Yahoo prices
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveComputed}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save results
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-800/50 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">{message}</div>
      )}

      {scenario.scenarioType === 'WHAT_IF' && (
        <div className="space-y-4">
          {whatIfResult && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Base value" value={formatCurrency(whatIfResult.base.value)} />
              <Metric label="Projected value" value={formatCurrency(whatIfResult.projected.value)} />
              <Metric
                label="Value impact"
                value={`${whatIfResult.deltas.value >= 0 ? '+' : ''}${formatCurrency(whatIfResult.deltas.value)}`}
                tone={whatIfResult.deltas.value >= 0 ? 'up' : 'down'}
              />
              <Metric
                label="% impact"
                value={`${whatIfResult.deltas.pct >= 0 ? '+' : ''}${whatIfResult.deltas.pct}%`}
                tone={whatIfResult.deltas.pct >= 0 ? 'up' : 'down'}
              />
            </div>
          )}

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Snapshot holdings
            </div>
            <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto">
              {(data.baseHoldings || []).length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  No holdings cloned. Create a new scenario with “Clone current portfolio” enabled.
                </p>
              ) : (
                (data.baseHoldings || []).map((h) => {
                  const projected = projectedByTicker[h.tickerSymbol];
                  const displayQty =
                    qtyEdits[h.tickerSymbol] !== undefined && qtyEdits[h.tickerSymbol] !== ''
                      ? Number(qtyEdits[h.tickerSymbol])
                      : projected
                        ? Number(projected.quantity)
                        : Number(h.quantity);
                  const changed = Number(displayQty) !== Number(h.quantity);
                  return (
                  <div
                    key={`${h.holdingId}-${h.tickerSymbol}`}
                    className="px-4 py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">
                        {h.tickerSymbol}{' '}
                        <span className="text-slate-400 font-normal">· {h.assetName}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Base: {h.quantity} × {formatCurrency(h.currentPrice)} ={' '}
                        {formatCurrency(Number(h.quantity) * Number(h.currentPrice))}
                      </p>
                      {changed && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          What-if: {displayQty} × {formatCurrency(projected?.markPrice ?? h.currentPrice)} ={' '}
                          {formatCurrency(Number(displayQty) * Number(projected?.markPrice ?? h.currentPrice))}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`${inputClass} w-24`}
                        placeholder="New qty"
                        value={
                          qtyEdits[h.tickerSymbol] ??
                          (projected ? String(projected.quantity) : String(h.quantity))
                        }
                        onChange={(e) =>
                          setQtyEdits((prev) => ({ ...prev, [h.tickerSymbol]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const raw = qtyEdits[h.tickerSymbol] ?? e.currentTarget.value;
                            if (raw === undefined || raw === '') return;
                            upsertChange({
                              op: 'QUANTITY',
                              holdingId: h.holdingId,
                              tickerSymbol: h.tickerSymbol,
                              quantity: Number(raw),
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-300 hover:border-brand-500"
                        onClick={() => {
                          const raw =
                            qtyEdits[h.tickerSymbol] ??
                            (projected ? String(projected.quantity) : String(h.quantity));
                          if (raw === undefined || raw === '') return;
                          upsertChange({
                            op: 'QUANTITY',
                            holdingId: h.holdingId,
                            tickerSymbol: h.tickerSymbol,
                            quantity: Number(raw),
                          });
                        }}
                      >
                        Apply qty
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-800/40 px-2 py-1.5 text-xs text-emerald-300"
                        onClick={() =>
                          upsertChange({
                            op: 'PRICE',
                            holdingId: h.holdingId,
                            tickerSymbol: h.tickerSymbol,
                            price: Number(h.currentPrice) * 1.1,
                            expectedPrice: Number(h.currentPrice) * 1.1,
                          })
                        }
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-800/40 px-2 py-1.5 text-xs text-rose-300"
                        onClick={() =>
                          upsertChange({
                            op: 'PRICE',
                            holdingId: h.holdingId,
                            tickerSymbol: h.tickerSymbol,
                            price: Number(h.currentPrice) * 0.9,
                            expectedPrice: Number(h.currentPrice) * 0.9,
                          })
                        }
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-800/40 px-2 py-1.5 text-xs text-rose-300"
                        onClick={() =>
                          upsertChange({
                            op: 'REMOVE',
                            holdingId: h.holdingId,
                            tickerSymbol: h.tickerSymbol,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Add position (live Yahoo price)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <input
                className={inputClass}
                placeholder="Ticker"
                value={addForm.tickerSymbol}
                onChange={(e) => setAddForm({ ...addForm, tickerSymbol: e.target.value.toUpperCase() })}
                onBlur={lookupAddTicker}
              />
              <input
                className={inputClass}
                placeholder="Name"
                value={addForm.assetName}
                onChange={(e) => setAddForm({ ...addForm, assetName: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                placeholder="Price"
                value={addForm.price}
                onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
              />
              <button
                type="button"
                onClick={handleAddHoldingChange}
                disabled={lookingUp}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>

          {(data.changes || []).length > 0 && (
            <div className="rounded-xl border border-slate-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Pending changes ({data.changes.length})
              </p>
              <div className="space-y-2">
                {(data.changes || []).map((c, i) => (
                  <div key={`${c.op}-${c.tickerSymbol}-${i}`} className="flex items-center justify-between text-xs text-slate-300">
                    <span>
                      <span className="font-mono text-brand-300">{c.op}</span>{' '}
                      {c.tickerSymbol || c.holdingId}
                      {c.quantity != null ? ` · qty ${c.quantity}` : ''}
                      {c.price != null || c.expectedPrice != null
                        ? ` · $${Number(c.price ?? c.expectedPrice).toFixed(2)}`
                        : ''}
                    </span>
                    <button type="button" className="text-rose-400" onClick={() => removeChange(i)}>
                      Undo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {scenario.scenarioType === 'FORECAST' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Initial investment" type="number" value={data.initialInvestment} onChange={(v) => updateField('initialInvestment', Number(v))} />
            <Field label="Annual return %" type="number" value={data.annualReturn} onChange={(v) => updateField('annualReturn', Number(v))} />
            <Field label="Inflation %" type="number" value={data.inflation} onChange={(v) => updateField('inflation', Number(v))} />
            <Field label="Volatility %" type="number" value={data.volatility} onChange={(v) => updateField('volatility', Number(v))} />
            <Field label="Years" type="number" value={data.years} onChange={(v) => updateField('years', Number(v))} />
            <Field label="Monthly contribution" type="number" value={data.monthlyContribution} onChange={(v) => updateField('monthlyContribution', Number(v))} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Projected (nominal)" value={formatCurrency(forecastLast?.nominal)} />
            <Metric label="Projected (real)" value={formatCurrency(forecastLast?.real)} />
            <Metric label="Monte Carlo median" value={formatCurrency(monteCarlo?.p50)} />
            <Metric label="Risk band" value={`${risk.label} (${data.volatility || 0}%)`} />
          </div>
          <p className="text-xs text-slate-500">
            Monte Carlo p5–p95: {formatCurrency(monteCarlo?.p5)} → {formatCurrency(monteCarlo?.p95)}
          </p>
        </div>
      )}

      {scenario.scenarioType === 'RETIREMENT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Current age" type="number" value={data.currentAge} onChange={(v) => updateField('currentAge', Number(v))} />
            <Field label="Retirement age" type="number" value={data.retirementAge} onChange={(v) => updateField('retirementAge', Number(v))} />
            <Field label="Current savings" type="number" value={data.currentSavings} onChange={(v) => updateField('currentSavings', Number(v))} />
            <Field label="Annual return %" type="number" value={data.annualReturn} onChange={(v) => updateField('annualReturn', Number(v))} />
            <Field label="Target amount" type="number" value={data.targetAmount} onChange={(v) => updateField('targetAmount', Number(v))} />
            <Field label="Monthly contribution" type="number" value={data.currentMonthlyContribution} onChange={(v) => updateField('currentMonthlyContribution', Number(v))} />
          </div>
          {retirement && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Years to retire" value={retirement.years} />
              <Metric label="FV of current savings" value={formatCurrency(retirement.fvLump)} />
              <Metric label="Required monthly" value={formatCurrency(retirement.requiredMonthly)} />
              <Metric
                label="On track?"
                value={retirement.reachableWithCurrent ? 'Yes' : 'No'}
                tone={retirement.reachableWithCurrent ? 'up' : 'down'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioDetailPanel;
