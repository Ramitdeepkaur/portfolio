import React, { useState } from 'react';
import { X, DollarSign, Calendar, Building2, Tag, Layers, Search } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleTickerBlur = async () => {
    if (formData.tickerSymbol.trim().length >= 1) {
      try {
        const data = await api.getMarketData(formData.tickerSymbol.trim().toUpperCase());
        if (data && data.currentPrice) {
          setLookupPrice(data.currentPrice);
          if (!formData.purchasePrice) {
            setFormData(prev => ({ ...prev, purchasePrice: data.currentPrice.toString() }));
          }
        }
      } catch (e) {
        console.log('Price lookup error', e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-100">Add New Investment</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Ticker Symbol *</label>
              <input
                type="text"
                required
                placeholder="e.g. AAPL, NVDA, VOO"
                value={formData.tickerSymbol}
                onChange={(e) => setFormData({ ...formData, tickerSymbol: e.target.value })}
                onBlur={handleTickerBlur}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 uppercase font-mono focus:border-brand-500 focus:outline-none"
              />
              {lookupPrice && (
                <span className="text-[11px] text-emerald-400 mt-1 block">Live Price: ${lookupPrice}</span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apple Inc."
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Asset Type *</label>
              <select
                value={formData.assetType}
                onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="STOCKS">Stocks</option>
                <option value="ETFS">ETFs</option>
                <option value="MUTUAL_FUNDS">Mutual Funds</option>
                <option value="BONDS">Bonds</option>
                <option value="CASH">Cash Holdings</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Sector</label>
              <input
                type="text"
                placeholder="e.g. Technology, Finance"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Purchase Price ($) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Exchange</label>
              <input
                type="text"
                placeholder="e.g. NASDAQ"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Currency</label>
              <input
                type="text"
                placeholder="USD"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHoldingModal;
