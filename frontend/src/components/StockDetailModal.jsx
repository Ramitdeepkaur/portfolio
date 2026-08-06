import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

// Dezerv chart constants
const DZ_GREEN2  = '#82a057';
const DZ_BORDER  = '#27272a';
const DZ_CARD2   = '#17171c';
const DZ_MUTED   = '#71717a';
const DZ_SUBTLE  = '#a1a1aa';

export const StockDetailModal = ({ ticker, isOpen, onClose }) => {
  const [activeTicker, setActiveTicker] = useState(ticker || 'AAPL');
  const [searchInput, setSearchInput]   = useState('');
  const [timeframe, setTimeframe]       = useState('1m');
  const [marketData, setMarketData]     = useState(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => { if (ticker) setActiveTicker(ticker); }, [ticker]);

  useEffect(() => {
    if (isOpen && activeTicker) fetchData();
  }, [isOpen, activeTicker, timeframe]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }
  }, [isOpen, onClose]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getMarketHistory(activeTicker, timeframe);
      setMarketData(data);
    } catch { setMarketData(null); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) { setActiveTicker(searchInput.toUpperCase().trim()); setSearchInput(''); }
  };

  if (!isOpen) return null;

  const isGain      = (marketData?.changeAmount ?? 0) >= 0;
  const historyData = (marketData?.history || []).map((p) => ({ date: p.date, price: Number(p.close) }));
  const fmt         = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  /* ── Custom Tooltip ── */
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: DZ_CARD2, border: `1px solid ${DZ_BORDER}`, borderRadius: 10,
        padding: '8px 12px', fontSize: 12, color: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
      }}>
        <p style={{ color: DZ_SUBTLE, marginBottom: 4, fontWeight: 600 }}>{label}</p>
        <p style={{ color: DZ_GREEN2, fontWeight: 700, fontFamily: 'monospace' }}>
          ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  };

  /* ── Mini stat tile ── */
  const StatTile = ({ label, main, sub, mainClass = 'text-white' }) => (
    <div className="p-3.5 rounded-xl bg-dz-dark border border-dz-border">
      <span className="text-[10px] font-semibold text-dz-muted uppercase tracking-wider block">{label}</span>
      <div className={`text-base font-bold font-mono mt-0.5 ${mainClass}`}>{main}</div>
      {sub && <div className="text-[11px] text-dz-muted font-mono mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-fade"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog" aria-modal="true" aria-label="Market detail"
    >
      <div
        className="w-full max-w-3xl rounded-2xl shadow-2xl modal-panel max-h-[90vh] overflow-y-auto space-y-5"
        style={{ background: '#121215', border: '1px solid #27272a' }}
      >
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 pb-5 border-b border-dz-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dz-dark border border-dz-border flex items-center justify-center font-bold font-mono text-sm flex-shrink-0">
              <span className="text-dz-amber">{activeTicker.substring(0, 4)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {activeTicker}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-dz-dark border border-dz-border text-dz-muted font-mono">
                  Market Watch
                </span>
              </h3>
              <p className="text-xs text-dz-muted">Live quotes & historical price statistics</p>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 text-dz-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. TSLA"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="dz-input pl-7 w-36 uppercase"
              />
            </div>
            <button type="submit"
              className="px-3 py-1.5 rounded-full bg-dz-amber hover:bg-dz-amber2 text-black text-xs font-bold transition-colors">
              Go
            </button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-dz-muted hover:text-white hover:bg-white/5 transition-colors ml-1"
              aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Metrics ── */}
          {loading ? (
            <div className="py-12 flex items-center justify-center text-dz-muted gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-dz-amber" />
              Loading market data…
            </div>
          ) : marketData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                label="Current Price"
                main={fmt(marketData.currentPrice)}
                sub={
                  <span className={`flex items-center gap-1 text-xs font-semibold ${isGain ? 'text-dz-green2' : 'text-rose-400'}`}>
                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isGain ? '+' : ''}{marketData.changePercentage}%
                  </span>
                }
                mainClass={isGain ? 'text-dz-green2' : 'text-rose-400'}
              />
              <StatTile
                label="Open / Close"
                main={fmt(marketData.openingPrice)}
                sub={`Close: ${fmt(marketData.closingPrice)}`}
              />
              <StatTile
                label="Day Range H / L"
                main={`H: ${fmt(marketData.highPrice)}`}
                sub={`L: ${fmt(marketData.lowPrice)}`}
              />
              <StatTile
                label="Volume"
                main={`${(marketData.volume / 1_000_000).toFixed(2)}M`}
                sub="Shares Traded"
              />
            </div>
          ) : (
            <div className="py-10 text-center text-dz-muted text-sm">
              Could not load market data for "{activeTicker}".
            </div>
          )}

          {/* ── Chart ── */}
          {marketData && !loading && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">Historical Price Trend</span>
                <div className="flex items-center p-1 bg-dz-dark border border-dz-border rounded-xl gap-0.5">
                  {['1w', '1m', '6m', '1y', '5y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeframe(range)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                        timeframe === range
                          ? 'bg-dz-green text-white shadow-sm'
                          : 'text-dz-muted hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={DZ_BORDER} vertical={false} />
                    <XAxis dataKey="date" stroke={DZ_MUTED} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: DZ_MUTED }} />
                    <YAxis stroke={DZ_MUTED} fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} tick={{ fill: DZ_MUTED }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isGain ? DZ_GREEN2 : '#f87171'}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: isGain ? DZ_GREEN2 : '#f87171', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
