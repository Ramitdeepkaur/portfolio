import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumData, holdData, allocData, perfData] = await Promise.all([
        api.getPortfolioSummary(),
        api.getHoldings(),
        api.getPortfolioAllocation(),
        api.getPortfolioPerformance(),
      ]);
      setSummary(sumData);
      setHoldings(holdData);
      setAllocation(allocData);
      setPerformance(perfData);
    } catch (err) {
      console.error('Failed to fetch portfolio data', err);
      showToast('Error connecting to backend API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        summary,
        holdings,
        allocation,
        performance,
        loading,
        toast,
        showToast,
        refreshData: fetchAllData,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
