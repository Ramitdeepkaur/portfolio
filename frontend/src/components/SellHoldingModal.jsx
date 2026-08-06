import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api/client';

export const SellHoldingModal = ({ holding, isOpen, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (holding) {
      setQuantity(holding.quantity != null ? holding.quantity.toString() : '');
      setNotes('');
      setError(null);
    }
  }, [holding]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !holding) return null;

  const formatMoney = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const qtyNum = Number(quantity);
  const heldQty = holding.quantity || 0;
  const currentPrice = holding.currentPrice != null ? Number(holding.currentPrice) : null;
  const estimatedProceeds =
    Number.isFinite(qtyNum) && qtyNum > 0 && currentPrice != null ? qtyNum * currentPrice : null;
  const willClose = Number.isFinite(qtyNum) && qtyNum > 0 && qtyNum >= heldQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!quantity || qtyNum <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (qtyNum > heldQty) {
      setError(`You only hold ${heldQty} shares of ${holding.tickerSymbol}.`);
      return;
    }

    setLoading(true);
    try {
       const response = await api.sellHolding(holding.id, qtyNum, notes);
      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to sell holding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500';
  const labelClass = 'block text-slate-500 dark:text-slate-400 font-medium mb-1';

  const purchasePrice = holding.purchasePrice != null ? Number(holding.purchasePrice) : null;
  const costBasis =
    Number.isFinite(qtyNum) && qtyNum > 0 && purchasePrice != null ? qtyNum * purchasePrice : null;
  const perSharePnL =
    Number.isFinite(purchasePrice) && purchasePrice > 0 && currentPrice != null
      ? currentPrice - purchasePrice
      : null;
  const realizedPnL =
    Number.isFinite(qtyNum) && qtyNum > 0 && Number.isFinite(perSharePnL)
      ? qtyNum * perSharePnL
      : null;
  const isGain = Number.isFinite(realizedPnL) && realizedPnL >= 0;
  const returnPct =
    Number.isFinite(purchasePrice) && purchasePrice > 0 && Number.isFinite(perSharePnL)
      ? (perSharePnL / purchasePrice) * 100
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overlay-fade" role="dialog" aria-modal="true" aria-label="Sell investment holding">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 modal-panel max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Sell {holding.tickerSymbol}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{holding.assetName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-slate-500 dark:text-slate-400 font-medium">You currently hold</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{heldQty} shares</span>
          </div>

          <div>
            <label className={labelClass}>Quantity to sell *</label>
            <input
              type="number"
              step="any"
              min="0.01"
              max={heldQty}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${inputClass} font-mono`}
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Sell the full position or a partial quantity — the remainder stays invested.
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1.5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Purchase Price</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {purchasePrice != null ? formatMoney(purchasePrice) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Current market price</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {currentPrice != null ? formatMoney(currentPrice) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated cost basis</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {costBasis != null ? formatMoney(costBasis) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated proceeds to cash</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {estimatedProceeds != null ? formatMoney(estimatedProceeds) : '—'}
              </span>
            </div>
            {realizedPnL != null && purchasePrice != null && purchasePrice > 0 && (
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Realized profit / loss</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-semibold ${
                      isGain
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isGain ? '+' : ''}{formatMoney(realizedPnL)}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      isGain
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    ({returnPct != null ? `${isGain ? '+' : ''}${returnPct.toFixed(2)}%` : '—'})
                  </span>
                  {isGain ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              {willClose
                ? 'This will fully close the position.'
                : 'This will reduce your quantity and keep the remainder invested.'}{' '}
              Final proceeds are calculated using the live price at the time of sale.
            </p>
           </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Add a note about this sale (e.g. 'Taking profits', 'Stop-loss triggered')"
              className={`${inputClass} resize-y`}
            />
            <p className="text-[11px] text-slate-400 mt-1 block">
              These notes will be appended to the auto-generated transaction record showing the ticker,
              quantity, price, proceeds, and realized profit/loss.
            </p>
          </div>

           {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Selling...' : 'Sell Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellHoldingModal;
