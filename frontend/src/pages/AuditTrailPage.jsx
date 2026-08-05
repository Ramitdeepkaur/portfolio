import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import api from '../api/client';

const AuditTrailPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filters, setFilters] = useState({ entity: 'all', action: 'all', search: '' });

  useEffect(() => {
    const loadData = async () => {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    };
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesEntity = filters.entity === 'all' || log.entity === filters.entity;
      const matchesAction = filters.action === 'all' || log.action === filters.action;
      const matchesSearch = !filters.search || `${log.entity} ${log.summary} ${log.user}`.toLowerCase().includes(filters.search.toLowerCase());
      return matchesEntity && matchesAction && matchesSearch;
    });
  }, [auditLogs, filters]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Audit trail</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track portfolio changes with before/after snapshots and actor metadata.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} className="bg-transparent outline-none">
                <option value="all">All entities</option>
                <option value="AAPL">AAPL</option>
                <option value="MSFT">MSFT</option>
                <option value="NVDA">NVDA</option>
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="bg-transparent outline-none">
                <option value="all">All actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search user or summary" className="bg-transparent outline-none" />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No audit events found.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">{log.action}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.entity}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{log.summary}</p>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    <div>{log.user}</div>
                    <div>{log.ipAddress}</div>
                    <div>{log.date}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Before</p>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{log.before}</pre>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-wider text-slate-500">After</p>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{log.after}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailPage;
