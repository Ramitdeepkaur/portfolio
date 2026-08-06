import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Check } from 'lucide-react';
import api from '../api/client';

export const EditHoldingModal = ({ holding, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    assetName: '', tickerSymbol: '', assetType: 'STOCKS',
    quantity: '', purchasePrice: '', purchaseDate: '',
    sector: '', exchange: '', currency: 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (holding) {
      setFormData({
        assetName:     holding.assetName     || '',
        tickerSymbol:  holding.tickerSymbol  || '',
        assetType:     holding.assetType     || 'STOCKS',
        quantity:      holding.quantity      || '',
        purchasePrice: holding.purchasePrice || '',
        purchaseDate:  holding.purchaseDate  || '',
        sector:        holding.sector        || '',
        exchange:      holding.exchange      || '',
        currency:      holding.currency      || 'USD',
      });
    }
  }, [holding]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !holding) return null;

  const patch = (key, val) => setFormData((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Quantity must be greater than zero.'); return;
    }
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      setError('Purchase price must be greater than zero.'); return;
    }
    setLoading(true);
    try {
      await api.updateHolding(holding.id, {
        ...formData,
        tickerSymbol:  formData.tickerSymbol.toUpperCase().trim(),
        quantity:      parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
      });
      onSuccess('Holding updated successfully!');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update holding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      role="dialog" aria-modal="true" aria-label="Edit investment holding"
    >
      <div className="w-full max-w-lg rounded-2xl shadow-2xl modal-panel max-h-[90vh] overflow-y-auto"
        style={{ background: '#121215', border: '1px solid #27272a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dz-border">
          <div>
            <h3 className="text-base font-bold text-white">Edit Investment</h3>
            <p className="text-[11px] text-dz-muted mt-0.5 font-mono">{holding.tickerSymbol} — {holding.assetName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dz-muted hover:text-white hover:bg-white/5 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dz-label">Ticker Symbol *</label>
              <input type="text" required value={formData.tickerSymbol}
                onChange={(e) => patch('tickerSymbol', e.target.value)}
                className="dz-input uppercase font-mono"
              />
            </div>
            <div>
              <label className="dz-label">Asset Name *</label>
              <input type="text" required value={formData.assetName}
                onChange={(e) => patch('assetName', e.target.value)}
                className="dz-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dz-label">Asset Type *</label>
              <select value={formData.assetType} onChange={(e) => patch('assetType', e.target.value)} className="dz-select">
                <option value="STOCKS">Stocks</option>
                <option value="ETFS">ETFs</option>
                <option value="MUTUAL_FUNDS">Mutual Funds</option>
                <option value="BONDS">Bonds</option>
                <option value="CASH">Cash Holdings</option>
              </select>
            </div>
            <div>
              <label className="dz-label">Sector</label>
              <input type="text" value={formData.sector}
                onChange={(e) => patch('sector', e.target.value)}
                className="dz-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dz-label">Quantity *</label>
              <input type="number" step="any" min="0.01" required value={formData.quantity}
                onChange={(e) => patch('quantity', e.target.value)}
                className="dz-input font-mono"
              />
            </div>
            <div>
              <label className="dz-label">Purchase Price ($) *</label>
              <input type="number" step="any" min="0.01" required value={formData.purchasePrice}
                onChange={(e) => patch('purchasePrice', e.target.value)}
                className="dz-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dz-label">Purchase Date *</label>
              <input type="date" required value={formData.purchaseDate}
                onChange={(e) => patch('purchaseDate', e.target.value)}
                className="dz-input"
              />
            </div>
            <div>
              <label className="dz-label">Exchange</label>
              <input type="text" value={formData.exchange}
                onChange={(e) => patch('exchange', e.target.value)}
                className="dz-input"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dz-border">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-full border border-dz-border bg-dz-dark text-dz-subtle hover:text-white transition-colors font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHoldingModal;
