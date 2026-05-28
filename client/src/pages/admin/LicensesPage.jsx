import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Plus, Shield, UserPlus, UserMinus, Download, Calendar, Clock, ShieldCheck, FileCode, User } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

import { fetchLicenses, createLicense, updateLicense, deleteLicense, assignSeat, unassignSeat } from '../../features/licenses/licenseSlice';
import { fetchEmployees } from '../../features/employees/employeeSlice';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import Badge, { LicenseStatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog, EmptyState } from '../../components/ui/StatCard';
import SearchableSelect from '../../components/ui/SearchableSelect';
import LicenseTypeDropdown from '../../components/ui/LicenseTypeDropdown';
import DatePicker from '../../components/ui/DatePicker';
const schema = yup.object({
  softwareName: yup.string().required('Software name is required'),
  licenseKey: yup.string().required('License key is required'),
  vendor: yup.string().required('Vendor is required'),
  expiryDate: yup.string().required('Expiry date is required'),
  totalSeats: yup.number().min(1).required('Total seats required'),
  cost: yup.number().min(0),
  licenseType: yup.string(),
  notes: yup.string(),
  purchaseDate: yup.string(),
});

export default function LicensesPage() {
  const dispatch = useDispatch();
  const { items: licenses, loading, total, page, totalPages } = useSelector(s => s.licenses);
  const { items: employees } = useSelector(s => s.employees);
  const { user } = useSelector(s => s.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [filters, setFilters] = useState({ page: 1, status: '' });

  const canManage = ['super_admin', 'it_team'].includes(user?.role);
  const canAssign = ['super_admin', 'it_team', 'hr_team'].includes(user?.role);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const employeeOptions = useMemo(() => {
    if (!selected) return [];
    return employees
      .filter(e => e.isActive && !selected.assignedTo?.find(u => u._id === e._id))
      .map(e => ({
        value: e._id,
        label: e.name,
        icon: User,
        description: e.email
      }));
  }, [employees, selected]);

  useEffect(() => { dispatch(fetchLicenses(filters)); }, [dispatch, filters]);
  useEffect(() => { dispatch(fetchEmployees({ limit: 200 })); }, [dispatch]);

  const openAdd = () => { reset({}); setSelected(null); setModalOpen(true); };
  const openEdit = (lic) => {
    setSelected(lic);
    reset({
      softwareName: lic.softwareName, licenseKey: lic.licenseKey, vendor: lic.vendor,
      expiryDate: lic.expiryDate?.split('T')[0], totalSeats: lic.totalSeats, cost: lic.cost,
      licenseType: lic.licenseType, notes: lic.notes, purchaseDate: lic.purchaseDate?.split('T')[0],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    let result;
    if (selected) result = await dispatch(updateLicense({ id: selected._id, data }));
    else result = await dispatch(createLicense(data));

    if (createLicense.fulfilled.match(result) || updateLicense.fulfilled.match(result)) {
      toast.success(selected ? 'License updated!' : 'License created!');
      setModalOpen(false);
    } else {
      toast.error(result.payload || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteLicense(deleteConfirm._id));
    if (deleteLicense.fulfilled.match(result)) { toast.success('License deleted!'); setDeleteConfirm(null); }
    else toast.error(result.payload || 'Failed');
  };

  const handleAssignSeat = async () => {
    if (!assignUserId) { toast.error('Select a user'); return; }
    const result = await dispatch(assignSeat({ id: selected._id, userId: assignUserId }));
    if (assignSeat.fulfilled.match(result)) { toast.success('Seat assigned!'); setAssignUserId(''); setSelected(result.payload); }
    else toast.error(result.payload || 'Failed');
  };

  const handleUnassignSeat = async (licId, userId) => {
    const result = await dispatch(unassignSeat({ id: licId, userId }));
    if (unassignSeat.fulfilled.match(result)) { toast.success('Seat removed!'); setSelected(result.payload); }
    else toast.error(result.payload || 'Failed');
  };

  const exportExcel = () => {
    const rows = licenses.map(l => ({
      Software: l.softwareName, Vendor: l.vendor, 'License Key': l.licenseKey,
      'Total Seats': l.totalSeats, 'Used Seats': l.usedSeats,
      'Expiry Date': l.expiryDate ? format(new Date(l.expiryDate), 'dd/MM/yyyy') : '',
      Cost: l.cost, Type: l.licenseType,
      Status: new Date(l.expiryDate) < new Date() ? 'Expired' : new Date(l.expiryDate) < new Date(Date.now() + 30 * 86400000) ? 'Expiring Soon' : 'Active',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Licenses');
    XLSX.writeFile(wb, `licenses-${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success('Exported to Excel!');
  };

  const columns = [
    { key: 'softwareName', label: 'Software', sortable: true, render: (val, row) => (
      <div>
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{val}</p>
        <p className="text-xs text-gray-400">{row.vendor}</p>
      </div>
    )},
    { key: 'licenseKey', label: 'License Key', render: (val) => (
      <span className="font-mono text-xs bg-gray-100 dark:bg-dark-600 px-2 py-0.5 rounded">{val?.length > 20 ? val.slice(0, 20) + '…' : val}</span>
    )},
    { key: 'expiryDate', label: 'Expiry', sortable: true, render: (val) => (
      <div>
        <LicenseStatusBadge expiryDate={val} />
        <p className="text-xs text-gray-400 mt-0.5">{val ? format(new Date(val), 'dd MMM yyyy') : '—'}</p>
      </div>
    )},
    { key: 'usedSeats', label: 'Seats', render: (val, row) => (
      <div className="w-28">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>{val}/{row.totalSeats}</span>
          <span>{row.totalSeats > 0 ? Math.round((val / row.totalSeats) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${val / row.totalSeats > 0.9 ? 'bg-red-500' : val / row.totalSeats > 0.7 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${row.totalSeats > 0 ? (val / row.totalSeats) * 100 : 0}%` }}
          />
        </div>
      </div>
    )},
    { key: 'cost', label: 'Cost', sortable: true, render: (val) => <span className="text-sm">₹{val?.toLocaleString() ?? 0}</span> },
    { key: '_id', label: 'Actions', align: 'right', render: (_, row) => (
      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
        {canAssign && (
          <button onClick={() => { setSelected(row); setDrawerOpen(true); }} className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
            <UserPlus size={15} className="text-primary-500" />
          </button>
        )}
        {canManage && (
          <>
            <button onClick={() => openEdit(row)} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">Edit</button>
            <button onClick={() => setDeleteConfirm(row)} className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Delete</button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Licenses <span className="text-gray-400 font-normal text-base">({total})</span></h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage software licenses and seat allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportExcel}>Export</Button>
          {canManage && <Button icon={Plus} onClick={openAdd}>Add License</Button>}
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchableSelect
          value={filters.status}
          onChange={val => setFilters(f => ({ ...f, status: val, page: 1 }))}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active', description: 'License is current and valid' },
            { value: 'expiring', label: 'Expiring Soon', description: 'License expires within 30 days' },
            { value: 'expired', label: 'Expired', description: 'License expiration date has passed' }
          ]}
          placeholder="All Statuses"
          className="w-48"
        />
        <Button variant="ghost" onClick={() => setFilters({ page: 1, status: '' })}>Clear</Button>
      </div>

      <DataTable
        columns={columns}
        data={licenses}
        loading={loading}
        emptyState={{ icon: Shield, title: 'No licenses found', description: 'Add your first software license.' }}
        pagination={{ page, totalPages, total, limit: 20 }}
        onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit License' : 'Add License'} size="lg" overflowVisible={true}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Software Name *</label>
              <input {...register('softwareName')} className={`input ${errors.softwareName ? 'border-red-400' : ''}`} placeholder="e.g. Microsoft Office 365" />
              {errors.softwareName && <p className="text-red-500 text-xs mt-1">{errors.softwareName.message}</p>}
            </div>
            <div>
              <label className="label">Vendor *</label>
              <input {...register('vendor')} className={`input ${errors.vendor ? 'border-red-400' : ''}`} placeholder="e.g. Microsoft" />
              {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">License Key *</label>
              <input {...register('licenseKey')} className={`input font-mono ${errors.licenseKey ? 'border-red-400' : ''}`} placeholder="XXXX-XXXX-XXXX-XXXX" />
              {errors.licenseKey && <p className="text-red-500 text-xs mt-1">{errors.licenseKey.message}</p>}
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <Controller
                name="purchaseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select purchase date"
                    error={errors.purchaseDate?.message}
                  />
                )}
              />
            </div>
            <div>
              <label className="label">Expiry Date *</label>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select expiry date"
                    error={errors.expiryDate?.message}
                  />
                )}
              />
            </div>
            <div>
              <label className="label">Total Seats *</label>
              <input {...register('totalSeats')} type="number" min="1" className={`input ${errors.totalSeats ? 'border-red-400' : ''}`} />
              {errors.totalSeats && <p className="text-red-500 text-xs mt-1">{errors.totalSeats.message}</p>}
            </div>
            <div>
              <label className="label">Cost (₹)</label>
              <input {...register('cost')} type="number" min="0" className="input" />
            </div>
            <div>
              <label className="label">License Type</label>
              <Controller
                control={control}
                name="licenseType"
                render={({ field }) => (
                  <LicenseTypeDropdown
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select type..."
                    error={errors.licenseType?.message}
                  />
                )}
              />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">{selected ? 'Update' : 'Create'} License</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Seat Management Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Seats: ${selected?.softwareName}`} width="w-96">
        {selected && (
          <div className="p-4 space-y-5">
            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Used Seats</span>
                <span className="font-bold">{selected.usedSeats} / {selected.totalSeats}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(selected.usedSeats / selected.totalSeats) * 100}%` }} />
              </div>
            </div>

            {canAssign && selected.usedSeats < selected.totalSeats && (
              <div className="space-y-3">
                <div>
                  <label className="label mb-1.5 block">Assign to Employee</label>
                  <SearchableSelect
                    value={assignUserId}
                    onChange={setAssignUserId}
                    options={employeeOptions}
                    placeholder="Select employee..."
                    searchPlaceholder="Search by name or email..."
                  />
                </div>
                <Button icon={UserPlus} onClick={handleAssignSeat} loading={loading} className="w-full justify-center">Assign Seat</Button>
              </div>
            )}

            <div>
              <h4 className="label mb-2">Currently Assigned ({selected.assignedTo?.length || 0})</h4>
              <div className="space-y-2">
                {(selected.assignedTo || []).map(u => (
                  <div key={u._id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-dark-600 last:border-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 text-sm font-bold">{u.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    {canAssign && (
                      <button onClick={() => handleUnassignSeat(selected._id, u._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <UserMinus size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                {(!selected.assignedTo || selected.assignedTo.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No seats assigned yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete License"
        message={`Delete "${deleteConfirm?.softwareName}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={loading}
      />
    </div>
  );
}
