import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-dark-700 rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading mb-1">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Skeleton({ className = '', variant = 'line' }) {
  if (variant === 'card') {
    return (
      <div className="card p-6 space-y-3">
        <div className="skeleton h-4 w-1/3 rounded-lg" />
        <div className="skeleton h-8 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
      </div>
    );
  }
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-dark-600">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-dark-600">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-5 ${j === 0 ? 'w-8' : j === 1 ? 'w-1/4' : 'flex-1'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {Icon && (
        <div className="w-20 h-20 bg-gray-100 dark:bg-dark-600 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={36} className="text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 font-heading mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-500 max-w-sm mb-6">{description}</p>}
      {action}
    </motion.div>
  );
}

export function StatCard({ icon: Icon, label, value, trend, color = 'primary', loading = false, onClick }) {
  const colorMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    accent: 'bg-accent-50 dark:bg-accent-900/20 text-accent-500 dark:text-accent-400',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {loading ? <div className="skeleton w-6 h-6 rounded" /> : <Icon size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <div className="skeleton h-8 w-20 mt-1 rounded" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-heading">{value?.toLocaleString() ?? '—'}</p>
        )}
        {trend && !loading && (
          <p className={`text-xs mt-0.5 font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </motion.div>
  );
}
