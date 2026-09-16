'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, Search, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Loader2 } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxDisplay?: number;
  id?: string;
  error?: boolean;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items found.',
  className,
  disabled = false,
  isLoading = false,
  maxDisplay = 3,
  id,
  error = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation (Escape key)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query)) ||
        (opt.badge && opt.badge.toLowerCase().includes(query))
    );
  }, [options, search]);

  const toggleOption = (value: string) => {
    if (disabled) return;
    const exists = selected.includes(value);
    if (exists) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter((v) => v !== value));
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const allValues = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...selected, ...allValues]));
    onChange(combined);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  const selectedOptions = React.useMemo(() => {
    return selected
      .map((val) => options.find((opt) => opt.value === val))
      .filter((opt): opt is MultiSelectOption => Boolean(opt));
  }, [selected, options]);

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)} id={id}>
      {/* Trigger Area */}
      <div
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={cn(
          'flex min-h-[36px] w-full items-center justify-between rounded-lg border bg-white px-2.5 py-1 text-xs shadow-xs transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600',
          error
            ? 'border-red-500 focus-visible:ring-red-500/20'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-600/20'
            : 'border-slate-300 hover:border-slate-400',
          disabled && 'cursor-not-allowed opacity-60 bg-slate-50'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-1 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 max-w-[160px] truncate rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[11px] font-medium text-blue-700 leading-tight"
                >
                  <span className="truncate">{opt.label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(opt.value, e)}
                      className="rounded p-0.5 hover:bg-blue-100 text-blue-600 hover:text-blue-900 transition-colors focus:outline-none shrink-0"
                      aria-label={`Remove ${opt.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}

              {selectedOptions.length > maxDisplay && (
                <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                  +{selectedOptions.length - maxDisplay} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : (
            <>
              {selectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Clear all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
            </>
          )}
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-[99999] mt-1 max-h-60 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-950 shadow-lg animate-in fade-in-50 zoom-in-95"
        >
          {/* Search Bar */}
          <div className="flex items-center border-b border-slate-100 px-2.5 py-1.5 gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between px-2 py-1 bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500">
            <span>{selected.length} selected</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="font-medium text-blue-600 hover:underline cursor-pointer"
              >
                Select All
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearAll()}
                  className="font-medium text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-40 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-blue-50/80 font-medium text-blue-900'
                        : 'hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex items-center justify-center shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {option.description && (
                          <span className="block text-[10px] text-slate-400 truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {option.badge && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shrink-0">
                        {option.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
