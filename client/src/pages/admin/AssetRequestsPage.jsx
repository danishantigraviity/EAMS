import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { assetRequestService } from '../../services/assetRequestService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_MAP = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  fulfilled: 'info'
};

const URGENCY_MAP = {
  low: 'success',
  medium: 'warning',
  high: 'danger'
};

export default function AssetRequestsPage() {
  const { user } = useSelector(s => s.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [filters, setFilters] = useState({ status: '', urgency: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const { register, handleSubmit, reset, control } = useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await assetRequestService.getAll({ ...filters, page: pagination.page, limit: 20 });
      setRequests(data.data);
      setPagination(p => ({ ...p, total: data.total, totalPages: data.totalPages }));
    } catch {
      toast.error('Failed to load asset requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters, pagination.page]);

  const onReviewSubmit = async (data) => {
    setLoading(true);
    try {
      await assetRequestService.update(reviewModal._id, data);
      toast.success('Asset request updated successfully!');
      setReviewModal(null);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'requestedBy',
      label: 'Employee',
      render: (val) => val ? (
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">{val.name}</p>
          <p className="text-xs text-gray-400">{val.email}</p>
        </div>
      ) : '—'
    },
    {
      key: 'assetType',
      label: 'Asset Type',
      render: (_, row) => (
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {row.assetTypeName || row.assetType}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <p className="text-sm max-w-xs truncate" title={val}>{val}</p>
    },
    {
      key: 'urgency',
      label: 'Urgency',
      render: (val) => (
        <Badge variant={URGENCY_MAP[val] || 'gray'}>
          {val?.charAt(0).toUpperCase() + val?.slice(1)}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={STATUS_MAP[val] || 'gray'} dot>
          {val?.charAt(0).toUpperCase() + val?.slice(1)}
        </Badge>
      )
    },
    {
      key: 'reviewNotes',
      label: 'Admin Notes',
      render: (val) => val ? (
        <p className="text-xs text-gray-550 dark:text-gray-400 italic max-w-[180px] truncate" title={val}>
          {val}
        </p>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Requested Date',
      sortable: true,
      render: (val) => <span className="text-sm text-gray-500">{val ? format(new Date(val), 'dd MMM yyyy') : '—'}</span>
    },
    {
      key: '_id',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
          {row.status === 'pending' || row.status === 'approved' ? (
            <button
              onClick={() => {
                setReviewModal(row);
                reset({ status: row.status, reviewNotes: row.reviewNotes || '' });
              }}
              className="px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
            >
              Review
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic px-2">Reviewed</span>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">
            Asset Requests <span className="text-gray-400 font-normal text-base">({pagination.total})</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage employee requests for new hardware or assets</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchableSelect
          value={filters.status}
          onChange={val => setFilters(f => ({ ...f, status: val }))}
          options={[
            { value: '', label: 'All Statuses' },
            ...['pending', 'approved', 'rejected', 'fulfilled'].map(s => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1)
            }))
          ]}
          searchable={false}
          className="w-44"
          placeholder="All Statuses"
        />
        <SearchableSelect
          value={filters.urgency}
          onChange={val => setFilters(f => ({ ...f, urgency: val }))}
          options={[
            { value: '', label: 'All Urgencies' },
            ...['low', 'medium', 'high'].map(u => ({
              value: u,
              label: u.charAt(0).toUpperCase() + u.slice(1)
            }))
          ]}
          searchable={false}
          className="w-40"
          placeholder="All Urgencies"
        />
        <Button variant="ghost" onClick={() => setFilters({ status: '', urgency: '' })}>Clear</Button>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        emptyState={{
          icon: FileText,
          title: 'No asset requests found',
          description: 'No requests match the selected filters.'
        }}
        pagination={{ ...pagination, limit: 20 }}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
      />

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Asset Request" size="sm" overflowVisible={true}>
        <form onSubmit={handleSubmit(onReviewSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label block font-semibold mb-1">Requested Asset Type</label>
            <div className="p-3 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {reviewModal?.assetTypeName || reviewModal?.assetType}
              </span>
            </div>
          </div>
          <div>
            <label className="label block font-semibold mb-1">Employee Description</label>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-700/50 p-3 rounded-xl max-h-32 overflow-y-auto whitespace-pre-wrap">
              {reviewModal?.description}
            </p>
          </div>
          <div>
            <label className="label">Update Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'fulfilled', label: 'Fulfilled' }
                  ]}
                  searchable={false}
                  placeholder="Select status"
                />
              )}
            />
          </div>
          <div>
            <label className="label">Reviewer Notes</label>
            <textarea
              {...register('reviewNotes')}
              rows={3}
              className="input resize-none"
              placeholder="Add feedback, approval remarks, or delivery notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">Save Review</Button>
            <Button variant="secondary" onClick={() => setReviewModal(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
