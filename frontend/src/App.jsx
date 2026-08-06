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
import EditHoldingModal from './components/EditHoldingModal';
import CsvModal from './components/CsvModal';
import StockDetailModal from './components/StockDetailModal';
import api from './api/client';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast, showToast, refreshData, deleteHolding } = usePortfolio();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [viewingMarketTicker, setViewingMarketTicker] = useState(null);

  const handleHoldingCreated = (msg) => {
    showToast(msg || 'Holding added successfully!');
    refreshData();
  };

  const handleHoldingUpdated = (msg) => {
    showToast(msg || 'Holding updated successfully!');
    refreshData();
  };

  const handleDeleteHolding = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment holding?')) {
      try {
        await api.deleteHolding(id);
        showToast('Holding removed from portfolio', 'success');
        refreshData();
      } catch (err) {
        showToast('Failed to delete holding', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onEditHolding={(h) => setEditingHolding(h)}
              onDeleteHolding={handleDeleteHolding}
              onViewMarket={(t) => setViewingMarketTicker(t)}
            />
          )}

          {activeTab === 'holdings' && (
            <HoldingsPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onEditHolding={(h) => setEditingHolding(h)}
              onDeleteHolding={handleDeleteHolding}
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

      {/* Global Modals */}
      <AddHoldingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleHoldingCreated}
      />

      <EditHoldingModal
        holding={editingHolding}
        isOpen={Boolean(editingHolding)}
        onClose={() => setEditingHolding(null)}
        onSuccess={handleHoldingUpdated}
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
