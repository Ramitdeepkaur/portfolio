import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export const AddHoldingModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assetName: '',
    tickerSymbol: '',
    assetType: 'STOCKS',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
  });

  const [loading, setLoading] = useState(false);
  const [lookupPrice, setLookupPrice] = useState(null);
  const [marketPrice, setMarketPrice] = useState(null);
  const [error, setError] = useState(null);

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

  if (!isOpen) return null;

  const handleTickerBlur = async () => {
    if (formData.tickerSymbol.trim().length >= 1) {
      try {
        const data = await api.getMarketData(formData.tickerSymbol.trim().toUpperCase());
        if (data && data.currentPrice) {
          const price = Number(data.currentPrice);
          setLookupPrice(price);
          setMarketPrice(price);

          if (!formData.purchasePrice) {
            setFormData(prev => ({ ...prev, purchasePrice: price.toString() }));
          }
        }
      } catch (e) {
        setLookupPrice(null);
        setMarketPrice(null);
      }
    }
  };

  const handleQuantityChange = (value) => {
    setFormData(prev => {
      const next = { ...prev, quantity: value };
      if (marketPrice && !next.purchasePrice) {
        next.purchasePrice = marketPrice.toString();
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      setError('Purchase price must be greater than zero.');
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tickerSymbol: formData.tickerSymbol.toUpperCase().trim(),
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
      };
      await api.createHolding(payload);
      onSuccess('Investment holding added successfully!');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add holding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500';
  const labelClass = 'block text-slate-500 dark:text-slate-400 font-medium mb-1';

  const qtyNum = Number(formData.quantity);
  const priceNum = Number(formData.purchasePrice);
  const totalCost =
    Number.isFinite(qtyNum) && qtyNum > 0 && Number.isFinite(priceNum) && priceNum > 0
      ? qtyNum * priceNum
      : null;
  const formatMoney = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overlay-fade" role="dialog" aria-modal="true" aria-label="Add new investment">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 modal-panel max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Investment</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-900" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ticker Symbol *</label>
              <input
                type="text"
                required
                placeholder="e.g. AAPL, NVDA, VOO"
                value={formData.tickerSymbol}
                onChange={(e) => setFormData({ ...formData, tickerSymbol: e.target.value })}
                onBlur={handleTickerBlur}
                className={`${inputClass} uppercase font-mono`}
              />
              {lookupPrice && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Live Price: ${lookupPrice}</span>
              )}
            </div>

            <div>
              <label className={labelClass}>Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apple Inc."
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Asset Type *</label>
              <select
                value={formData.assetType}
                onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                className={inputClass}
              >
                <option value="STOCKS">Stocks</option>
                <option value="ETFS">ETFs</option>
                <option value="MUTUAL_FUNDS">Mutual Funds</option>
                <option value="BONDS">Bonds</option>
                <option value="CASH">Cash Holdings</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Sector</label>
              <input
                type="text"
                placeholder="e.g. Technology, Finance"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Quantity *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>Purchase Price / share ($) *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className={`${inputClass} font-mono`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Per-share cost basis (defaults to live quote)
              </span>
            </div>
          </div>

          {totalCost != null && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated total invested</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(totalCost)}
                <span className="text-slate-400 font-normal ml-2">
                  ({qtyNum} × {formatMoney(priceNum)})
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Purchase Date *</label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Exchange</label>
              <input
                type="text"
                placeholder="e.g. NASDAQ"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Currency</label>
              <input
                type="text"
                placeholder="USD"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={inputClass}
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHoldingModal;