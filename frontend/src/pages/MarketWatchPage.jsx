import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Eye, LineChart } from 'lucide-react';
import StockDetailModal from '../components/StockDetailModal';

export const MarketWatchPage = () => {
  const watchlist = [
    { ticker: 'AAPL', name: 'Apple Inc.', price: '$185.50', change: '+1.2%', isGain: true, sector: 'Technology' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', price: '$125.60', change: '+3.4%', isGain: true, sector: 'Semiconductors' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', price: '$420.20', change: '+0.4%', isGain: true, sector: 'Software' },
    { ticker: 'TSLA', name: 'Tesla Inc.', price: '$248.50', change: '-1.8%', isGain: false, sector: 'Automotive' },
    { ticker: 'SPY', name: 'SPDR S&P 500 ETF', price: '$545.30', change: '+0.8%', isGain: true, sector: 'Large Cap ETF' },
    { ticker: 'QQQ', name: 'Invesco QQQ Trust', price: '$480.10', change: '+1.5%', isGain: true, sector: 'Tech ETF' },
    { ticker: 'VTI', name: 'Vanguard Total Stock', price: '$260.40', change: '+0.6%', isGain: true, sector: 'Broad Market ETF' },
    { ticker: 'BND', name: 'Vanguard Total Bond', price: '$72.50', change: '-0.1%', isGain: false, sector: 'Fixed Income' },
  ];

  const [selectedTicker, setSelectedTicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWatchlist = watchlist.filter(item =>
    item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Market Watch & Historical Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore real-time market data quotes, OHLC statistics, and multi-period price charts</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Grid of Watchlist Cards */}
      {filteredWatchlist.length === 0 ? (
        <div className="glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
            <LineChart className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">No symbols match your search</p>
          <p className="text-slate-400 text-xs">Try a different ticker, name, or sector.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWatchlist.map((item) => (
            <div
              key={item.ticker}
              onClick={() => setSelectedTicker(item.ticker)}
              className="glass-card rounded-2xl p-5 hover:border-brand-400/50 cursor-pointer transition-all duration-300 group space-y-3 hover:-translate-y-0.5 dark:hover:border-brand-500/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold flex items-center justify-center font-mono text-sm flex-shrink-0 transition-transform group-hover:scale-105 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-brand-600 dark:text-brand-400">{item.ticker.substring(0, 3)}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">{item.ticker}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{item.name}</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${item.isGain ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                  {item.isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{item.change}</span>
                </span>
              </div>

              <div className="flex items-end justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Current Quote</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">{item.price}</span>
                </div>
                <button className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:text-white group-hover:bg-brand-600 transition-colors dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white dark:group-hover:bg-brand-600">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StockDetailModal
        ticker={selectedTicker}
        isOpen={Boolean(selectedTicker)}
        onClose={() => setSelectedTicker(null)}
      />
    </div>
  );
};

export default MarketWatchPage;