import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader2, Search, Building2 } from 'lucide-react';
import api from '../api/client';

const DEBOUNCE_MS = 300;

/**
 * Reusable Yahoo Finance asset autocomplete input.
 * - Debounced search-as-you-type (cancels stale requests)
 * - Dropdown shows asset name, ticker symbol, exchange, sector, asset type
 * - Loading indicator while searching, friendly error on API failure
 * - Selecting an item calls onSelect(item); dropdown hides when input is cleared
 *   or no matches are found
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
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const justSelectedRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search against Yahoo Finance
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return undefined;
    }

    const term = query.trim();
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
    setResults([]);
    setSearchError(null);
    setShowDropdown(true);
    setHighlightedIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const data = await api.searchMarket(term, controller.signal);
        if (controller.signal.aborted) return;
        setResults(Array.isArray(data) ? data : []);
        setSearchError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError('Unable to fetch market suggestions right now.');
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
  }, [query]);

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setQuery(nextValue);
    onChange(nextValue);
  };

  const handleSelect = (item) => {
    justSelectedRef.current = true;
    setQuery('');
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
    }
  };

  // Hide dropdown when there is nothing to show
  const dropdownVisible = showDropdown && (isSearching || !!searchError || results.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          onBlur={onBlur}
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

      {dropdownVisible && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 shadow-2xl backdrop-blur-lg p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {isSearching && results.length === 0 && (
            <div className="px-3 py-3 text-slate-400 flex items-center gap-2 justify-center font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              Searching Yahoo Finance...
            </div>
          )}

          {!isSearching && searchError && (
            <div className="px-3 py-2.5 text-rose-500 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {!isSearching && !searchError && results.map((item, idx) => (
            <button
              key={`${item.tickerSymbol}-${idx}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 group ${
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
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono font-bold text-[11px] group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20">
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
        </div>
      )}
    </div>
  );
};

export default AssetSearchInput;
