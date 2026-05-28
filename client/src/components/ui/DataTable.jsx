import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable, EmptyState } from './StatCard';

export default function DataTable({
  columns,
  data,
  loading,
  emptyState,
  pagination,
  onPageChange,
  rowKey = '_id',
  onRowClick,
  selectable,
  selectedRows,
  onSelectRow,
  onSelectAll,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av == null) return 1; if (bv == null) return -1;
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  if (loading) return <SkeletonTable rows={5} cols={columns.length} />;

  if (!loading && data.length === 0) {
    return (
      <div className="card">
        <EmptyState {...(emptyState || { title: 'No data found', description: 'No records match your search.' })} />
      </div>
    );
  }

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronsUpDown size={14} className="opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-100 dark:border-dark-600">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedRows?.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-header ${col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-dark-600">
            {sortedData.map((row, idx) => (
              <motion.tr
                key={row[rowKey] || idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`table-row ${onRowClick ? 'cursor-pointer' : ''} ${selectedRows?.includes(row[rowKey]) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedRows?.includes(row[rowKey])}
                      onChange={() => onSelectRow?.(row[rowKey])}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={`table-cell ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pagination.page === p ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
