import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Wrench, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge, { PriorityBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/StatCard';
import FileUploader from '../../components/ui/FileUploader';
import SearchableSelect from '../../components/ui/SearchableSelect';

const STATUS_MAP = { open: 'danger', 'in-progress': 'warning', resolved: 'success', cancelled: 'gray' };

export default function MaintenancePage() {
  const { user } = useSelector(s => s.auth);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const { register, handleSubmit, reset, control } = useForm();
  const { register: regUpdate, handleSubmit: hsUpdate, reset: resetUpdate, control: controlUpdate } = useForm();

  const canManage = ['super_admin', 'it_team'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await maintenanceService.getAll({ ...filters, page: pagination.page, limit: 20 });
      setRequests(data.data);
      setPagination(p => ({ ...p, total: data.total, totalPages: data.totalPages }));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters, pagination.page]);
  useEffect(() => {
    assetService.getAll({ limit: 200 }).then(({ data }) => setAssets(data.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);
      await maintenanceService.create(fd);
      toast.success('Maintenance request submitted!');
      setModalOpen(false);
      reset();
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const onUpdate = async (data) => {
    setLoading(true);
    try {
      await maintenanceService.update(updateModal._id, data);
      toast.success('Request updated!');
      setUpdateModal(null);
      resetUpdate();
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    try {
      await maintenanceService.delete(deleteConfirm._id);
      toast.success('Request cancelled');
      setDeleteConfirm(null);
      load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'assetId', label: 'Asset', render: (val) => val ? <div><p className="font-medium text-sm">{val.name}</p><p className="text-xs text-gray-400">{val.serialNumber}</p></div> : '—' },
    { key: 'issue', label: 'Issue', render: (val) => <p className="text-sm max-w-xs truncate">{val}</p> },
    { key: 'priority', label: 'Priority', render: (val) => <PriorityBadge priority={val} /> },
    { key: 'status', label: 'Status', render: (val) => <Badge variant={STATUS_MAP[val] || 'gray'}>{val?.replace(/-/g, ' ')}</Badge> },
    { key: 'reportedBy', label: 'Reported By', render: (val) => <span className="text-sm">{val?.name || '—'}</span> },
    { key: 'notes', label: 'Resolution Notes', render: (val) => val ? <p className="text-xs text-gray-550 dark:text-gray-400 italic max-w-[180px] truncate" title={val}>{val}</p> : <span className="text-xs text-gray-400">—</span> },
    { key: 'createdAt', label: 'Date', sortable: true, render: (val) => <span className="text-sm text-gray-500">{val ? format(new Date(val), 'dd MMM yyyy') : '—'}</span> },
    { key: '_id', label: 'Actions', align: 'right', render: (_, row) => (
      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
        {canManage && row.status !== 'resolved' && row.status !== 'cancelled' && (
          <button onClick={() => { setUpdateModal(row); resetUpdate({ status: row.status, notes: row.notes || '' }); }} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">Update</button>
        )}
        {(user?.role === 'employee' || canManage) && row.status === 'open' && (
          <button onClick={() => setDeleteConfirm(row)} className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg">Cancel</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Maintenance <span className="text-gray-400 font-normal text-base">({pagination.total})</span></h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage asset maintenance requests</p>
        </div>
        <Button icon={Plus} onClick={() => { reset(); setImageFile(null); setModalOpen(true); }}>New Request</Button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchableSelect
          value={filters.status}
          onChange={val => setFilters(f => ({ ...f, status: val }))}
          options={[
            { value: '', label: 'All Statuses' },
            ...['open', 'in-progress', 'resolved', 'cancelled'].map(s => ({
              value: s,
              label: s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
            }))
          ]}
          searchable={false}
          className="w-44"
          placeholder="All Statuses"
        />
        <SearchableSelect
          value={filters.priority}
          onChange={val => setFilters(f => ({ ...f, priority: val }))}
          options={[
            { value: '', label: 'All Priorities' },
            ...['low', 'medium', 'high'].map(p => ({
              value: p,
              label: p.charAt(0).toUpperCase() + p.slice(1)
            }))
          ]}
          searchable={false}
          className="w-40"
          placeholder="All Priorities"
        />
        <Button variant="ghost" onClick={() => setFilters({ status: '', priority: '' })}>Clear</Button>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        emptyState={{ icon: Wrench, title: 'No maintenance requests', description: 'All assets are functioning well!' }}
        pagination={{ ...pagination, limit: 20 }}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
      />

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Maintenance Request" size="md" overflowVisible={true}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Asset *</label>
            <Controller
              name="assetId"
              control={control}
              rules={{ required: 'Asset is required' }}
              render={({ field, fieldState: { error } }) => (
                <SearchableSelect
                  value={field.value || ''}
                  onChange={field.onChange}
                  options={assets.map(a => ({
                    value: a._id,
                    label: `${a.name} — ${a.serialNumber}`
                  }))}
                  placeholder="Select asset..."
                  error={error?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="label">Issue Description *</label>
            <textarea {...register('issue', { required: true })} rows={3} className="input resize-none" placeholder="Describe the issue in detail..." />
          </div>
          <div>
            <label className="label">Priority</label>
            <Controller
              name="priority"
              control={control}
              defaultValue="low"
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                  searchable={false}
                  placeholder="Select priority"
                />
              )}
            />
          </div>
          <div>
            <label className="label">Attach Photo (optional)</label>
            <FileUploader onFileSelect={setImageFile} accept={{ 'image/*': [] }} hint="JPG, PNG up to 5MB" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">Submit Request</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Update Modal */}
      <Modal isOpen={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Request" size="sm" overflowVisible={true}>
        <form onSubmit={hsUpdate(onUpdate)} className="p-6 space-y-4">
          <div>
            <label className="label">Status</label>
            <Controller
              name="status"
              control={controlUpdate}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' }
                  ]}
                  searchable={false}
                  placeholder="Select status"
                />
              )}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...regUpdate('notes')} rows={3} className="input resize-none" placeholder="Add resolution notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">Update</Button>
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleCancel} title="Cancel Request" message="Cancel this maintenance request?" confirmLabel="Cancel Request" />
    </div>
  );
}
