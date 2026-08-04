import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Plus, Search, Trash2, PencilLine } from 'lucide-react';
import api from '../api/client';
import TransactionModal from '../components/TransactionModal';
import { usePortfolio } from '../context/PortfolioContext';

const TransactionHistoryPage = () => {
  const { holdings } = usePortfolio();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalTransactions: 0, totalVolume: 0, buyVolume: 0, sellVolume: 0 });
  const [filters, setFilters] = useState({ holding: 'all', type: 'all', search: '' });
  const [sort, setSort] = useState({ field: 'date', order: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const txData = await api.getTransactions();
      setTransactions(txData);
      setStats(await api.getTransactionStats());
    };
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const result = transactions.filter((tx) => {
      const matchesHolding = filters.holding === 'all' || tx.holding === filters.holding;
      const matchesType = filters.type === 'all' || tx.type === filters.type;
      const matchesSearch = !filters.search || `${tx.holding} ${tx.notes}`.toLowerCase().includes(filters.search.toLowerCase());
      return matchesHolding && matchesType && matchesSearch;
    });

    result.sort((a, b) => {
      const direction = sort.order === 'asc' ? 1 : -1;
      if (sort.field === 'amount') return (Number(a.amount || 0) - Number(b.amount || 0)) * direction;
      if (sort.field === 'type') return a.type.localeCompare(b.type) * direction;
      return a.date.localeCompare(b.date) * direction;
    });

    return result;
  }, [transactions, filters, sort]);

  const handleSaveTransaction = async (record) => {
    const savedTransaction = record.id
      ? await api.updateTransaction(record.id, record)
      : await api.createTransaction(record);

    setTransactions((prev) => {
      const exists = prev.some((item) => item.id === savedTransaction.id);
      return exists
        ? prev.map((item) => (item.id === savedTransaction.id ? savedTransaction : item))
        : [savedTransaction, ...prev];
    });

    setStats(await api.getTransactionStats());
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = async (id) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((item) => item.id !== id));
    setStats(await api.getTransactionStats());
  };

  const handleExport = async () => {
    const blob = await api.exportTransactionsCsv();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Transaction history</h2>
            <p className="mt-1 text-sm text-slate-400">Review manual transactions, filter them, and export a CSV snapshot.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-400" /> Export CSV
            </button>
            <button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add transaction
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Transactions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{stats.totalTransactions}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total volume</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">${Number(stats.totalVolume || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Buy volume</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">${Number(stats.buyVolume || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Sell volume</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">${Number(stats.sellVolume || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={filters.holding} onChange={(e) => setFilters({ ...filters, holding: e.target.value })} className="bg-transparent outline-none">
                <option value="all">All holdings</option>
                {holdings.map((holding) => (
                  <option key={holding.id} value={holding.tickerSymbol || holding.assetName}>
                    {holding.tickerSymbol || holding.assetName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search notes or ticker" className="bg-transparent outline-none" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="bg-transparent outline-none">
                <option value="all">All types</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
          </div>

          <select value={`${sort.field}:${sort.order}`} onChange={(e) => {
            const [field, order] = e.target.value.split(':');
            setSort({ field, order });
          }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
            <option value="date:desc">Newest first</option>
            <option value="date:asc">Oldest first</option>
            <option value="amount:desc">Highest amount</option>
            <option value="amount:asc">Lowest amount</option>
            <option value="type:asc">Type A-Z</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-3 py-3">Holding</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center text-slate-400">No transactions match the current filters.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/70 text-slate-300">
                    <td className="px-3 py-3 font-medium text-slate-100">{tx.holding}</td>
                    <td className="px-3 py-3">{tx.type}</td>
                    <td className="px-3 py-3">{tx.date}</td>
                    <td className="px-3 py-3">{tx.quantity}</td>
                    <td className="px-3 py-3">${Number(tx.price || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">${Number(tx.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">{tx.notes || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingTransaction(tx); setIsModalOpen(true); }} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white">
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} className="rounded-lg border border-rose-800/50 p-2 text-rose-300 hover:text-rose-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
        onSave={handleSaveTransaction}
        holdings={holdings}
        initialTransaction={editingTransaction}
      />
    </div>
  );
};

export default TransactionHistoryPage;
