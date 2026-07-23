import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

export const CsvModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const blob = await api.exportHoldingsCsv();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio_holdings_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onSuccess('Portfolio exported to CSV successfully!');
    } catch (err) {
      console.error('Export error', err);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.importHoldingsCsv(formData);
      onSuccess('Holdings imported from CSV successfully!');
      onClose();
    } catch (err) {
      console.error('Import error', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "AssetName,TickerSymbol,AssetType,Quantity,PurchasePrice,PurchaseDate,Sector,Exchange,Currency\n" +
      "Alphabet Inc,GOOGL,STOCKS,10,175.50,2024-01-15,Technology,NASDAQ,USD\n" +
      "SPDR S&P 500,SPY,ETFS,15,545.00,2023-11-10,Index,NYSE,USD\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "portfolio_template.csv";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">CSV Export / Import</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <h4 className="text-sm font-semibold text-slate-200">Export Portfolio</h4>
          <p className="text-xs text-slate-400">Download all your active holdings formatted as a standard CSV file.</p>
          <button
            onClick={handleExport}
            className="w-full mt-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Portfolio CSV</span>
          </button>
        </div>

        {/* Import Section */}
        <form onSubmit={handleImport} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">Import Holdings</h4>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="text-[11px] text-brand-400 hover:underline font-medium"
            >
              Get Sample Template
            </button>
          </div>
          <p className="text-xs text-slate-400">Upload a CSV file containing asset details to bulk import into your portfolio.</p>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
          />

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Importing...' : 'Upload & Import CSV'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CsvModal;
