import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import DashboardPage from './pages/DashboardPage';
import HoldingsPage from './pages/HoldingsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import AuditTrailPage from './pages/AuditTrailPage';
import ScenariosPage from './pages/ScenariosPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketWatchPage from './pages/MarketWatchPage';

import AddHoldingModal from './components/AddHoldingModal';
import SellHoldingModal from './components/SellHoldingModal';
import CsvModal from './components/CsvModal';
import StockDetailModal from './components/StockDetailModal';
import ChatWidget from './components/ChatWidget';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast, showToast, refreshData } = usePortfolio();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [sellingHolding, setSellingHolding] = useState(null);
  const [viewingMarketTicker, setViewingMarketTicker] = useState(null);

  const handleHoldingCreated = (msg) => {
    showToast(msg || 'Holding added successfully!');
    refreshData();
  };

  const handleSellSuccess = (response) => {
    const ticker = response?.tickerSymbol || 'holding';
    const proceeds = response?.proceeds != null ? Number(response.proceeds).toFixed(2) : '—';
    const gain = response?.realizedGain != null ? Number(response.realizedGain) : null;
    const cash = response?.cashAvailable != null ? Number(response.cashAvailable).toFixed(2) : null;
    const gainText =
      gain == null ? '' : ` (${gain >= 0 ? '+' : ''}$${gain.toFixed(2)} P/L)`;
    const cashText = cash != null ? ` Cash now $${cash}.` : '';
    showToast(`Sold ${ticker} for $${proceeds}${gainText}.${cashText}`, 'success');
    refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onSellHolding={(h) => setSellingHolding(h)}
              onViewMarket={(t) => setViewingMarketTicker(t)}
            />
          )}

          {activeTab === 'holdings' && (
            <HoldingsPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onSellHolding={(h) => setSellingHolding(h)}
              onViewMarket={(t) => setViewingMarketTicker(t)}
            />
          )}

          {activeTab === 'transactions' && <TransactionHistoryPage />}

          {activeTab === 'audit' && <AuditTrailPage />}

          {activeTab === 'scenarios' && <ScenariosPage />}

          {activeTab === 'analytics' && (
            <AnalyticsPage onViewMarket={(t) => setViewingMarketTicker(t)} />
          )}

          {activeTab === 'market' && <MarketWatchPage />}
        </main>
      </div>

      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleHoldingCreated}
      />

      <SellHoldingModal
        holding={sellingHolding}
        isOpen={Boolean(sellingHolding)}
        onClose={() => setSellingHolding(null)}
        onSuccess={handleSellSuccess}
      />

      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          refreshData();
        }}
      />

      <StockDetailModal
        ticker={viewingMarketTicker}
        isOpen={Boolean(viewingMarketTicker)}
        onClose={() => setViewingMarketTicker(null)}
      />

      <ChatWidget />

      <Toast toast={toast} />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
    </ThemeProvider>
  );
}

export default App;
