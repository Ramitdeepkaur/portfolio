import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const emptyForm = {
  holding: '',
  type: 'BUY',
  quantity: 1,
  price: 0,
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

const TransactionModal = ({ isOpen, onClose, onSave, holdings = [], initialTransaction = null }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialTransaction) {
      setForm({
        holding: initialTransaction.holding || '',
        type: initialTransaction.type || 'BUY',
        quantity: initialTransaction.quantity || 1,
        price: initialTransaction.price || 0,
        date: initialTransaction.date || new Date().toISOString().slice(0, 10),
        notes: initialTransaction.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [isOpen, initialTransaction]);

  const amount = useMemo(() => {
    const qty = Number(form.quantity || 0);
    const price = Number(form.price || 0);
    return (qty * price).toFixed(2);
  }, [form.quantity, form.price]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};
    if (!form.holding) nextErrors.holding = 'Select a holding';
    if (!form.quantity || Number(form.quantity) <= 0) nextErrors.quantity = 'Quantity must be positive';
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Price must be positive';
    if (!form.date) nextErrors.date = 'Date is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...initialTransaction,
      holding: form.holding,
      type: form.type,
      quantity: Number(form.quantity),
      price: Number(form.price),
      amount: Number(amount),
      date: form.date,
      notes: form.notes,
    });
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
  const labelClass = 'mb-1 block text-sm text-slate-600 dark:text-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4 overlay-fade">
      <div className="glass-card w-full max-w-xl rounded-2xl p-6 shadow-2xl modal-panel max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{initialTransaction ? 'Edit transaction' : 'Add transaction'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Record a manual cash movement for a holding.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:hover:text-white dark:hover:bg-slate-900" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Holding</label>
              <select
                value={form.holding}
                onChange={(e) => setForm({ ...form, holding: e.target.value })}
                className={inputClass}
              >
                <option value="">Select holding</option>
                {holdings.map((holding) => (
                  <option key={holding.id} value={holding.tickerSymbol || holding.assetName}>
                    {holding.tickerSymbol || holding.assetName}
                  </option>
                ))}
              </select>
              {errors.holding && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.holding}</p>}
            </div>

            <div>
              <label className={labelClass}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputClass}
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="DIVIDEND">Dividend</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className={inputClass}
              />
              {errors.quantity && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.quantity}</p>}
            </div>

            <div>
              <label className={labelClass}>Price</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
              {errors.price && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.price}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.date}</p>}
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-300">
            Estimated amount: <span className="font-semibold">${amount}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 font-semibold hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
              Save transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
