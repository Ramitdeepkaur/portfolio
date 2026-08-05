import React from 'react';
import { Activity, Clock3 } from 'lucide-react';

const HoldingHistoryPanel = ({ holding, transactions = [], auditLogs = [] }) => {
  if (!holding) {
    return null;
  }

  const ticker = holding.tickerSymbol || holding.assetName;
  const latestTransactions = transactions.filter((tx) => tx.holding === ticker).slice(0, 5);
  const latestAudit = auditLogs.filter((log) => log.entity === ticker || log.entity === holding.assetName).slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ticker} history</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Recent activity and audit changes</p>
        </div>
        <div className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
          Live snapshot
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Activity className="h-4 w-4 text-brand-400" />
            Recent transactions
          </div>
          <div className="space-y-2">
            {latestTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No transactions recorded yet.</div>
            ) : (
              latestTransactions.map((tx) => (
                <div key={tx.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{tx.type}</span>
                    <span className="text-slate-500 dark:text-slate-400">{tx.date}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Qty {tx.quantity} • ${tx.amount?.toFixed(2) || '0.00'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Clock3 className="h-4 w-4 text-emerald-400" />
            Audit trail
          </div>
          <div className="space-y-2">
            {latestAudit.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No audit events recorded yet.</div>
            ) : (
              latestAudit.map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span className="text-slate-500 dark:text-slate-400">{log.date}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{log.summary}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldingHistoryPanel;
