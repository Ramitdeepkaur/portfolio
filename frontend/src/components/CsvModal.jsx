import React, { useState, useEffect } from 'react';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../api/client';

export const CsvModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setError(null);
    try {
      const blob = await api.exportHoldingsCsv();
      const url  = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onSuccess('Portfolio exported to CSV successfully!');
    } catch {
      setError('Failed to export portfolio. Please try again.');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.importHoldingsCsv(fd);
      onSuccess('Holdings imported from CSV successfully!');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to import CSV. Check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv =
      'AssetName,TickerSymbol,AssetType,Quantity,PurchasePrice,PurchaseDate,Sector,Exchange,Currency\n' +
      'Alphabet Inc,GOOGL,STOCKS,10,175.50,2024-01-15,Technology,NASDAQ,USD\n' +
      'SPDR S&P 500,SPY,ETFS,15,545.00,2023-11-10,Index,NYSE,USD\n';
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'portfolio_template.csv',
    });
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      role="dialog" aria-modal="true" aria-label="CSV export and import"
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl modal-panel max-h-[90vh] overflow-y-auto"
        style={{ background: '#121215', border: '1px solid #27272a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dz-border">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-dz-green2" />
            <h3 className="text-base font-bold text-white">CSV Export / Import</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dz-muted hover:text-white hover:bg-white/5 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Export */}
          <div className="p-4 rounded-xl bg-dz-dark border border-dz-border space-y-3">
            <h4 className="text-sm font-semibold text-white">Export Portfolio</h4>
            <p className="text-xs text-dz-muted">Download all active holdings as a standard CSV file.</p>
            <button
              onClick={handleExport}
              className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-dz-border bg-dz-card2 text-dz-subtle hover:text-white hover:border-dz-border2 transition-colors text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-dz-green2" />
              Download Portfolio CSV
            </button>
          </div>

          {/* Import */}
          <form onSubmit={handleImport} className="p-4 rounded-xl bg-dz-dark border border-dz-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Import Holdings</h4>
              <button type="button" onClick={downloadTemplate}
                className="text-[11px] text-dz-amber hover:underline font-medium">
                Get Sample Template
              </button>
            </div>
            <p className="text-xs text-dz-muted">Upload a CSV file to bulk-import holdings into your portfolio.</p>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => { setFile(e.target.files[0]); setError(null); }}
              className="w-full text-xs text-dz-muted
                file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0
                file:text-xs file:font-semibold file:bg-dz-amber file:text-black
                hover:file:bg-dz-amber2 cursor-pointer"
            />

            <button type="submit" disabled={!file || loading}
              className="w-full btn-primary justify-center disabled:opacity-40 text-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? 'Importing…' : 'Upload & Import CSV'}
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CsvModal;
