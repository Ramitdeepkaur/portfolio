import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, Search, Building2 } from 'lucide-react';
import api from '../api/client';

const DEBOUNCE_MS = 300;

/**
 * Yahoo Finance asset autocomplete.
 * Dropdown is portaled + fixed-position so modal overflow cannot clip it.
 */
export const AssetSearchInput = ({
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder,
  className = '',
  ariaLabel,
  required = false,
}) => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const justSelectedRef = useRef(false);
  const blurTimerRef = useRef(null);

  const updateMenuPosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 280),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!showDropdown) return undefined;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [showDropdown, results, isSearching, searchError]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const menu = document.getElementById('asset-search-menu');
        if (menu && menu.contains(e.target)) return;
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return undefined;
    }

    const term = String(value ?? '').trim();
    if (!term) {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      setSearchError(null);
      return undefined;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);
    setShowDropdown(true);
    setHighlightedIndex(-1);
    updateMenuPosition();

    const timer = setTimeout(async () => {
      try {
        let data = await api.searchTickers(term, 8);
        if (controller.signal.aborted) return;
        if (!Array.isArray(data) || data.length === 0) {
          data = await api.searchMarket(term, controller.signal);
        }
        if (controller.signal.aborted) return;

        const normalized = (Array.isArray(data) ? data : []).map((item) => ({
          tickerSymbol: item.tickerSymbol || item.symbol || '',
          assetName: item.assetName || item.shortName || item.longName || item.symbol || '',
          exchange: item.exchange || '',
          assetType:
            item.assetType ||
            (item.quoteType === 'ETF'
              ? 'ETFS'
              : item.quoteType === 'MUTUALFUND'
                ? 'MUTUAL_FUNDS'
                : 'STOCKS'),
          sector: item.sector || '',
        }));
        setResults(normalized);
        setSearchError(null);
        setShowDropdown(true);
        updateMenuPosition();
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError('Unable to fetch market suggestions right now.');
        setShowDropdown(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleSelect = (item) => {
    justSelectedRef.current = true;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setResults([]);
    setIsSearching(false);
    setSearchError(null);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    onSelect(item);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleBlur = (e) => {
    // Delay so suggestion mousedown/click can run first
    blurTimerRef.current = setTimeout(() => {
      setShowDropdown(false);
      if (onBlur) onBlur(e);
    }, 150);
  };

  const dropdownVisible = showDropdown && (isSearching || !!searchError || results.length > 0);

  const menu = dropdownVisible
    ? createPortal(
        <div
          id="asset-search-menu"
          style={menuStyle}
          className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xl p-1 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {isSearching && results.length === 0 && (
            <div className="px-3 py-3 text-slate-400 flex items-center gap-2 justify-center font-medium text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              Searching Yahoo Finance...
            </div>
          )}

          {!isSearching && searchError && (
            <div className="px-3 py-2.5 text-rose-500 dark:text-rose-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {!isSearching &&
            !searchError &&
            results.map((item, idx) => (
              <button
                key={`${item.tickerSymbol}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 group text-xs ${
                  idx === highlightedIndex
                    ? 'bg-brand-50 dark:bg-slate-800/80'
                    : 'hover:bg-brand-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                    {item.assetName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.exchange && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.exchange}
                      </span>
                    )}
                    {item.sector && (
                      <>
                        <span>•</span>
                        <span>{item.sector}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono font-bold text-[11px]">
                    {item.tickerSymbol}
                  </span>
                  {item.assetType && (
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                      {item.assetType}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || isSearching) {
              setShowDropdown(true);
              updateMenuPosition();
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck="false"
          className={`${className} pr-8`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
      {menu}
    </div>
  );
};

export default AssetSearchInput;
