export const formatCurrency = (val) => {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
};

export const formatNumber = (val, digits = 0) => {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Number(val));
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const monthlyRate = (annualPct) => {
  const r = Number(annualPct || 0) / 100;
  return Math.pow(1 + r, 1 / 12) - 1;
};

export const round2 = (val) => Math.round(Number(val || 0) * 100) / 100;

/* Deterministic forecast projection (monthly compounding) */
export const projectForecast = ({ initialInvestment, annualReturn, inflation, years, monthlyContribution }) => {
  const months = Math.max(1, Math.round(Number(years) * 12));
  const r = monthlyRate(annualReturn);
  const inflAnnual = Number(inflation || 0) / 100;
  let nominal = Number(initialInvestment || 0);
  let contributed = Number(initialInvestment || 0);

  const series = [{ year: 0, nominal: round2(nominal), real: round2(nominal), contributed: round2(contributed) }];

  for (let m = 1; m <= months; m++) {
    nominal = nominal * (1 + r) + Number(monthlyContribution || 0);
    contributed += Number(monthlyContribution || 0);
    if (m % 12 === 0 || m === months) {
      const y = m / 12;
      const real = nominal * Math.pow(1 - inflAnnual, y);
      series.push({ year: y, nominal: round2(nominal), real: round2(real), contributed: round2(contributed) });
    }
  }
  return series;
};

export const milestoneFromSeries = (series, year) => {
  const point = series.find((p) => p.year === year) || [...series].sort((a, b) => b.year - a.year)[0];
  return point || null;
};

/* Box-Muller standard normal */
const gaussRandom = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const percentile = (sortedArr, p) => {
  if (!sortedArr.length) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor((p / 100) * sortedArr.length)));
  return sortedArr[idx];
};

const average = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

/* Monte Carlo simulation with monthly lognormal steps */
export const runMonteCarlo = ({
  initialInvestment,
  annualReturn,
  volatility,
  years,
  monthlyContribution,
  simulations = 1000,
}) => {
  const months = Math.max(1, Math.round(Number(years) * 12));
  const mu = Number(annualReturn || 0) / 100 / 12;
  const sig = Number(volatility || 0) / 100 / Math.sqrt(12);
  const contribution = Number(monthlyContribution || 0);
  const yearlyBuckets = {};
  const finals = [];

  for (let s = 0; s < simulations; s++) {
    let value = Number(initialInvestment || 0);
    for (let m = 1; m <= months; m++) {
      const z = gaussRandom();
      value = value * Math.exp(mu - 0.5 * sig * sig + sig * z) + contribution;
      if (m % 12 === 0) {
        const y = m / 12;
        if (!yearlyBuckets[y]) yearlyBuckets[y] = [];
        yearlyBuckets[y].push(value);
      }
    }
    finals.push(value);
  }

  const sortedFinals = [...finals].sort((a, b) => a - b);
  const yearSeries = [];
  for (let y = 1; y <= Math.round(Number(years)); y++) {
    const vals = (yearlyBuckets[y] || []).sort((a, b) => a - b);
    if (!vals.length) continue;
    yearSeries.push({
      year: y,
      p5: round2(percentile(vals, 5)),
      p25: round2(percentile(vals, 25)),
      p50: round2(percentile(vals, 50)),
      p75: round2(percentile(vals, 75)),
      p95: round2(percentile(vals, 95)),
      mean: round2(average(vals)),
    });
  }

  return {
    simulations,
    p5: round2(percentile(sortedFinals, 5)),
    p25: round2(percentile(sortedFinals, 25)),
    p50: round2(percentile(sortedFinals, 50)),
    p75: round2(percentile(sortedFinals, 75)),
    p95: round2(percentile(sortedFinals, 95)),
    mean: round2(average(finals)),
    yearSeries,
    finalDistribution: finals,
  };
};

/* Risk band assessment based on volatility */
export const assessRisk = (volatility) => {
  const v = Number(volatility || 0);
  if (v <= 5) return { label: 'Very Low', color: 'emerald', detail: 'Stable assets like cash and short-term bonds' };
  if (v <= 10) return { label: 'Low', color: 'emerald', detail: 'Conservative growth, mostly bonds and blue-chips' };
  if (v <= 15) return { label: 'Moderate', color: 'amber', detail: 'Balanced mix of stocks and bonds' };
  if (v <= 25) return { label: 'High', color: 'rose', detail: 'Growth-heavy equity portfolio' };
  return { label: 'Very High', color: 'rose', detail: 'Concentrated or speculative positions' };
};

/* Retirement planning analysis */
export const retirementAnalysis = ({
  currentAge,
  retirementAge,
  currentSavings,
  annualReturn,
  targetAmount,
  currentMonthlyContribution = 0,
}) => {
  const years = Math.max(1, Number(retirementAge) - Number(currentAge));
  const months = Math.round(years * 12);
  const r = monthlyRate(annualReturn);
  const contribution = Number(currentMonthlyContribution || 0);

  const fvLump = Number(currentSavings || 0) * Math.pow(1 + r, months);
  const annuityFactor = r > 1e-9 ? (Math.pow(1 + r, months) - 1) / r : months;
  const shortfall = Math.max(0, Number(targetAmount) - fvLump);
  const requiredMonthly = annuityFactor > 0 ? shortfall / annuityFactor : 0;
  const reachableWithCurrent = fvLump + contribution * annuityFactor >= Number(targetAmount);

  let timelineMonths = null;
  let value = Number(currentSavings || 0);
  for (let m = 1; m <= months; m++) {
    value = value * (1 + r) + contribution;
    if (timelineMonths === null && value >= Number(targetAmount)) timelineMonths = m;
  }

  const series = [{ year: 0, value: round2(Number(currentSavings || 0)), target: Number(targetAmount) }];
  let v = Number(currentSavings || 0);
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) v = v * (1 + r) + contribution;
    series.push({ year: y, value: round2(v), target: Number(targetAmount) });
  }

  return {
    years,
    fvLump: round2(fvLump),
    requiredMonthly: round2(requiredMonthly),
    reachableWithCurrent,
    timelineYears: timelineMonths === null ? null : round2(timelineMonths / 12),
    series,
  };
};

/* ---- WHAT-IF analysis on a holdings snapshot ---- */
export const normalizeHolding = (h) => ({
  holdingId: h.id ?? null,
  assetName: h.assetName || h.tickerSymbol || 'Unknown',
  tickerSymbol: h.tickerSymbol || '',
  assetType: h.assetType || 'STOCKS',
  quantity: Number(h.quantity || 0),
  purchasePrice: Number(h.purchasePrice || 0),
  currentPrice: Number(h.currentPrice || 0),
  sector: h.sector || 'General',
});

/* Apply change operations to a base holdings snapshot and compute impact */
export const applyWhatIfChanges = (baseHoldings, changes) => {
  const rows = (baseHoldings || []).map((h) => ({ ...normalizeHolding(h), isNew: false, op: null, expectedPrice: Number(h.currentPrice || 0) }));

  (changes || []).forEach((change) => {
    if (change.op === 'ADD') {
      const existing = rows.find((row) => !row.isNew && row.holdingId === change.holdingId && !change.holdingId);
      if (!existing) {
        rows.push({
          holdingId: null,
          assetName: change.assetName || change.tickerSymbol || 'New Asset',
          tickerSymbol: change.tickerSymbol || '',
          assetType: change.assetType || 'STOCKS',
          quantity: Number(change.quantity || 0),
          purchasePrice: Number(change.purchasePrice ?? change.price ?? 0),
          currentPrice: Number(change.price || 0),
          expectedPrice: Number(change.price || 0),
          sector: change.sector || 'General',
          isNew: true,
          op: 'ADD',
        });
      }
    } else {
      const row = rows.find((r) => String(r.holdingId) === String(change.holdingId));
      if (!row) return;
      if (change.op === 'REMOVE') {
        row.removed = true;
      } else if (change.op === 'QUANTITY') {
        row.quantity = Math.max(0, Number(change.quantity || 0));
        row.op = 'QUANTITY';
      } else if (change.op === 'PRICE') {
        row.expectedPrice = Number(change.expectedPrice ?? change.price ?? 0);
        row.op = 'PRICE';
      }
    }
  });

  const activeRows = rows.filter((r) => !r.removed);
  const valuate = (list, useExpected) => {
    let value = 0;
    let invested = 0;
    let pl = 0;
    const per = list.map((row) => {
      const price = useExpected ? row.expectedPrice : row.currentPrice;
      const rowValue = row.quantity * price;
      const rowInvested = row.quantity * row.purchasePrice;
      const rowPL = rowValue - rowInvested;
      value += rowValue;
      invested += rowInvested;
      pl += rowPL;
      return { ...row, value: round2(rowValue), invested: round2(rowInvested), pl: round2(rowPL) };
    });
    return { value: round2(value), invested: round2(invested), pl: round2(pl), per };
  };

  const base = valuate(activeRows, false);
  const projected = valuate(activeRows, true);

  const impactByHolding = projected.per
    .map((row) => {
      const baseRow = base.per.find((b) => b.tickerSymbol === row.tickerSymbol);
      const valueDelta = row.value - (baseRow ? baseRow.value : 0);
      const plDelta = row.pl - (baseRow ? baseRow.pl : 0);
      return {
        tickerSymbol: row.tickerSymbol,
        assetName: row.assetName,
        valueDelta: round2(valueDelta),
        plDelta: round2(plDelta),
        pctOfPortfolio: base.value > 0 ? (row.value / base.value) * 100 : 0,
        changed: row.isNew || row.removed === false ? row.op : 'UNCHANGED',
      };
    })
    .sort((a, b) => Math.abs(b.plDelta) - Math.abs(a.plDelta));

  return {
    base,
    projected,
    impactByHolding,
    deltas: {
      value: round2(projected.value - base.value),
      pl: round2(projected.pl - base.pl),
      pct: base.value > 0 ? round2(((projected.value - base.value) / base.value) * 100) : 0,
      roi: round2(base.invested > 0 ? (projected.pl / projected.invested) * 100 - (base.invested > 0 ? (base.pl / base.invested) * 100 : 0) : 0),
      holdingsCount: projected.per.length - base.per.length,
    },
  };
};

export const SCENARIO_TYPES = {
  WHAT_IF: { label: 'What-If Analysis', color: 'brand' },
  FORECAST: { label: 'Forecast', color: 'emerald' },
  RETIREMENT: { label: 'Retirement', color: 'amber' },
};

export const typeBadgeClasses = (type) => {
  switch (type) {
    case 'WHAT_IF': return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
    case 'FORECAST': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'RETIREMENT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default: return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};
