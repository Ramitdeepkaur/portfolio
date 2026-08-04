import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { projectForecast, retirementAnalysis, formatCurrency } from '../utils/scenarioMath';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16'];

const getScenarioSeries = (scenario) => {
  const data = scenario.data || {};
  let series = null;

  if (scenario.scenarioType === 'FORECAST' && Array.isArray(data.series) && data.series.length) {
    series = data.series;
  } else if (scenario.scenarioType === 'FORECAST') {
    series = projectForecast({
      initialInvestment: data.initialInvestment,
      annualReturn: data.annualReturn,
      inflation: data.inflation,
      years: data.years,
      monthlyContribution: data.monthlyContribution,
    });
  } else if (scenario.scenarioType === 'RETIREMENT' && Array.isArray(data.result?.series) && data.result.series.length) {
    series = data.result.series;
  } else if (scenario.scenarioType === 'RETIREMENT') {
    series = retirementAnalysis({
      currentAge: data.currentAge,
      retirementAge: data.retirementAge,
      currentSavings: data.currentSavings,
      annualReturn: data.annualReturn,
      targetAmount: data.targetAmount,
      currentMonthlyContribution: data.currentMonthlyContribution,
    }).series;
  } else if (scenario.scenarioType === 'WHAT_IF') {
    const base = Number(data.result?.base?.value ?? scenario.basePortfolioValue ?? 0);
    const projected = Number(data.result?.projected?.value ?? base);
    series = [
      { year: 0, value: base },
      { year: 1, value: base },
    ];
    scenario.__whatIfProjected = projected;
  }

  return series || [];
};

export const ScenarioComparisonChart = ({ scenarios = [], height = 380 }) => {
  const chartData = useMemo(() => {
    const seriesList = scenarios.map((scenario) => ({ scenario, series: getScenarioSeries(scenario) }));
    const maxYear = Math.max(1, ...seriesList.flatMap(({ series }) => series.map((p) => Number(p.year || 0))));

    const merged = [];
    for (let y = 0; y <= maxYear; y++) {
      const row = { year: y };
      seriesList.forEach(({ scenario, series }) => {
        const point = series.find((p) => Number(p.year) === y) || [...series].sort((a, b) => b.year - a.year)[0];
        if (point) {
          if (scenario.scenarioType === 'WHAT_IF') {
            row[`s_${scenario.id}`] = y === 0 ? point.value : scenario.__whatIfProjected;
          } else {
            row[`s_${scenario.id}`] = Number(point.value ?? point.nominal ?? 0);
          }
        }
      });
      merged.push(row);
    }
    return merged;
  }, [scenarios]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-xl text-xs font-sans space-y-1.5">
        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">Year {label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold text-slate-100 font-mono">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-80 flex items-center justify-center text-slate-500 text-sm">
        Select at least one scenario with projection data to compare.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-100">Scenario Comparison</h3>
        <p className="text-xs text-slate-400">Projected portfolio value over time across selected scenarios</p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            {scenarios.map((scenario, index) => (
              <Line
                key={scenario.id}
                type="monotone"
                dataKey={`s_${scenario.id}`}
                name={scenario.name}
                stroke={PALETTE[index % PALETTE.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScenarioComparisonChart;
