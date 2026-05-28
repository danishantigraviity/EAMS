import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  value,
  onChange,
  options = [], // [{ value, label, icon: IconComponent, description }]
  placeholder = 'Select...',
  error = null,
  className = '',
  name = '',
  searchPlaceholder = 'Search...',
  searchable = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Click outside to close popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, isMobile]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
    if (!isOpen) {
      setSearch('');
      setFocusedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.value.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, searchable]);

  // Scroll active keyboard-focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === value);
  }, [options, value]);

  // Helper render to avoid React unmounting/focus-loss issue
  const renderDropdownList = () => {
    return (
      <div className="flex flex-col h-full max-h-[280px] overflow-hidden bg-white dark:bg-dark-800 rounded-2xl w-full">
        {/* Search Input (Mobile Drawer Only) */}
        {searchable && isMobile && (
          <div className="p-3 bg-gray-50/50 dark:bg-dark-900/40 border-b border-gray-100 dark:border-dark-700/50 flex items-center gap-2.5 flex-shrink-0">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-dark-600 scrollbar-track-transparent py-1.5"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">
              No options found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isFocused = idx === focusedIndex;
              const isSelected = value === opt.value;
              const IconComp = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`group w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all ${
                    isSelected
                      ? 'bg-primary-50/80 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                      : isFocused
                      ? 'bg-gray-50 dark:bg-dark-700/50 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {IconComp && <IconComp size={16} className={`flex-shrink-0 transition-colors ${isSelected ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-500'}`} />}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className={`text-xxs truncate transition-colors ${isSelected ? 'text-primary-400/90' : 'text-gray-400 dark:text-gray-500'}`}>
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-primary-500 flex-shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {searchable ? (
        <div
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }
          }}
          className={`w-full h-[42px] flex items-center justify-between px-3.5 rounded-xl bg-white dark:bg-dark-800 border text-sm text-left transition-all outline-none focus-within:ring-2 focus-within:ring-primary-500/20 ${
            error
              ? 'border-red-400 dark:border-red-500/60 focus-within:border-red-400'
              : 'border-gray-200 dark:border-dark-600/70 hover:border-gray-300 dark:hover:border-dark-500 focus-within:border-primary-500'
          } ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}`}
        >
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            {selectedOption?.icon && !isOpen && (
              <selectedOption.icon size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              name={name}
              value={isOpen ? search : (selectedOption ? selectedOption.label : '')}
              onChange={(e) => {
                if (!isOpen) setIsOpen(true);
                setSearch(e.target.value);
              }}
              onFocus={() => {
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white border-0 outline-none focus:ring-0 p-0 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex items-center flex-shrink-0 ml-2">
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setSearch('');
                  if (isOpen) {
                    searchInputRef.current?.focus();
                  }
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white mr-1.5"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
                if (!isOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
              />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          name={name}
          className={`w-full h-[42px] flex items-center justify-between px-3.5 rounded-xl bg-white dark:bg-dark-800 border text-sm text-left transition-all outline-none focus:ring-2 focus:ring-primary-500/20 ${
            error
              ? 'border-red-400 dark:border-red-500/60 focus:border-red-400'
              : 'border-gray-200 dark:border-dark-600/70 hover:border-gray-300 dark:hover:border-dark-500 focus:border-primary-500'
          } ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}`}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-medium">
              {selectedOption.icon && <selectedOption.icon size={16} className="text-gray-500 dark:text-gray-400" />}
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-gray-400 font-normal">{placeholder}</span>
          )}

          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-primary-500' : ''}`}
          />
        </button>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black z-50 md:hidden"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="fixed left-0 right-0 bottom-0 bg-white dark:bg-dark-800 rounded-t-3xl z-50 md:hidden overflow-hidden max-h-[50vh] border-t border-gray-100 dark:border-dark-700 shadow-2xl flex flex-col"
                >
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full mx-auto my-3 flex-shrink-0" />
                  <div className="px-4 pb-2 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-gray-900 dark:text-white font-heading text-base">
                      {placeholder}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderDropdownList()}
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl shadow-xl overflow-hidden"
              >
                {renderDropdownList()}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
