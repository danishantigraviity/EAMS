import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';

export default function DatePicker({ value, onChange, placeholder = 'Select date', error, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse date string from form value ("YYYY-MM-DD")
  const selectedDate = value ? (() => {
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return null;
  })() : null;

  // Visual state for calendar month/year
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  // Keep viewDate in sync with selectedDate when it changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handlePrevYear = () => {
    setViewDate(new Date(currentYear - 1, currentMonth, 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(currentYear + 1, currentMonth, 1));
  };

  const handleSelectDay = (day) => {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setViewDate(new Date());
  };

  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewDate(today);
    setIsOpen(false);
  };

  // Generate days grid (42 cells: 6 rows * 7 columns)
  const getDaysGrid = () => {
    const grid = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const totalDays = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      grid.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }
    
    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }
    
    // Days from next month to fill grid
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return grid;
  };

  const daysGrid = getDaysGrid();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Date Input field */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full pl-10 pr-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all text-sm cursor-pointer select-none ${error ? 'border-red-400' : 'border-gray-200/80 dark:border-dark-700'}`}
      >
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        
        <span className={selectedDate ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}>
          {selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder}
        </span>

        {value && (
          <button 
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 mt-2 w-72 bg-white dark:bg-dark-800 border border-gray-150/80 dark:border-dark-700 rounded-2xl shadow-xl z-50 p-4 overflow-hidden"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-dark-700/60 pb-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="p-1 hover:bg-gray-50 dark:hover:bg-dark-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-lg transition-colors"
                  title="Previous Year"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-gray-50 dark:hover:bg-dark-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-lg transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <span className="text-sm font-bold text-gray-850 dark:text-gray-105 select-none">
                {format(viewDate, 'MMMM yyyy')}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-50 dark:hover:bg-dark-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-lg transition-colors"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="p-1 hover:bg-gray-50 dark:hover:bg-dark-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-lg transition-colors"
                  title="Next Year"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {dayNames.map((name) => (
                <span key={name} className="text-xs font-bold text-gray-400 dark:text-gray-500 py-1 select-none">
                  {name}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {daysGrid.map(({ date, isCurrentMonth }, idx) => {
                const isDaySelected = selectedDate && isSameDay(date, selectedDate);
                const isDayToday = isToday(date);
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(date)}
                    className={`
                      relative text-xs font-semibold h-8 w-8 mx-auto flex items-center justify-center rounded-xl transition-all duration-200
                      ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-250'}
                      ${isCurrentMonth && !isDaySelected ? 'hover:bg-gray-50 dark:hover:bg-dark-750' : ''}
                      ${isDaySelected ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-105' : ''}
                    `}
                  >
                    {date.getDate()}
                    {isDayToday && !isDaySelected && (
                      <span className="absolute bottom-1 w-1 h-1 bg-primary-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-dark-700/60">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors px-2 py-1"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
