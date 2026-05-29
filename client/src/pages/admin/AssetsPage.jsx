import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, QrCode, History, UserCheck, UserX, Eye, CheckCircle2, User, AlertTriangle, ShieldAlert, Wrench, Calendar, DollarSign, MapPin, Tag, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { fetchAssets, createAsset, updateAsset, deleteAsset, assignAsset, unassignAsset, fetchAssetHistory } from '../../features/assets/assetSlice';
import { fetchEmployees } from '../../features/employees/employeeSlice';
import { fetchDashboardStats } from '../../features/dashboard/dashboardSlice';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import Badge, { AssetStatusBadge } from '../../components/ui/Badge';
import { ConfirmDialog, EmptyState } from '../../components/ui/StatCard';
import FileUploader from '../../components/ui/FileUploader';
import AssetTypeDropdown from '../../components/ui/AssetTypeDropdown';
import SearchableSelect from '../../components/ui/SearchableSelect';
import DatePicker from '../../components/ui/DatePicker';
import AssetImage from '../../components/ui/AssetImage';
import ProfileImage from '../../components/ui/ProfileImage';

const ASSET_STATUSES = ['available','assigned','damaged','maintenance','retired'];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', icon: CheckCircle2, description: 'Asset is ready to be assigned' },
  { value: 'assigned', label: 'Assigned', icon: User, description: 'Currently allocated to an employee' },
  { value: 'damaged', label: 'Damaged', icon: ShieldAlert, description: 'Broken or malfunctioning' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Undergoing repair or inspection' },
  { value: 'retired', label: 'Retired', icon: AlertTriangle, description: 'Decommissioned from the system' },
];

const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses', icon: Package },
  ...STATUS_OPTIONS
];

const assetSchema = yup.object({
  name: yup.string().required('Name is required'),
  type: yup.string().required('Type is required'),
  serialNumber: yup.string().required('Serial number is required'),
  vendor: yup.string(),
  purchaseDate: yup.string(),
  warrantyExpiry: yup.string(),
  cost: yup.number().min(0),
  notes: yup.string(),
  location: yup.string(),
});

export default function AssetsPage() {
  const dispatch = useDispatch();
  const { items: assets, loading, total, page, totalPages } = useSelector(s => s.assets);
  const { items: employees } = useSelector(s => s.employees);
  const { user } = useSelector(s => s.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '', search: '', page: 1 });
  
  const employeeOptions = useMemo(() => {
    return employees
      .filter(e => e.isActive)
      .map(e => ({
        value: e._id,
        label: e.name,
        description: e.email,
        icon: User
      }));
  }, [employees]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [historyAsset, setHistoryAsset] = useState(null);
  const { history } = useSelector(s => s.assets);

  const canManage = ['super_admin', 'it_team'].includes(user?.role);
  const canAssign = ['super_admin', 'it_team', 'hr_team'].includes(user?.role);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: yupResolver(assetSchema) });

  const load = useCallback(() => {
    dispatch(fetchAssets({ ...filters }));
  }, [dispatch, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { dispatch(fetchEmployees({ limit: 200 })); }, [dispatch]);

  const openAdd = () => { reset({}); setSelected(null); setImageFile(null); setModalOpen(true); };
  const openEdit = (asset) => {
    setSelected(asset);
    reset({
      name: asset.name, type: asset.type, serialNumber: asset.serialNumber,
      vendor: asset.vendor, cost: asset.cost, notes: asset.notes, location: asset.location,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      department: asset.department?._id,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    if (imageFile) fd.append('image', imageFile);

    let result;
    if (selected) {
      result = await dispatch(updateAsset({ id: selected._id, data: fd }));
    } else {
      result = await dispatch(createAsset(fd));
    }

    if (createAsset.fulfilled.match(result) || updateAsset.fulfilled.match(result)) {
      toast.success(selected ? 'Asset updated!' : 'Asset created!');
      setModalOpen(false);
      dispatch(fetchDashboardStats());
    } else {
      toast.error(result.payload || 'Operation failed');
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployee) { toast.error('Select an employee'); return; }
    const result = await dispatch(assignAsset({ id: selected._id, data: { employeeId: selectedEmployee } }));
    if (assignAsset.fulfilled.match(result)) {
      toast.success('Asset assigned!');
      setAssignModalOpen(false);
      setSelectedEmployee('');
    } else {
      toast.error(result.payload || 'Assignment failed');
    }
  };

  const handleUnassign = async (asset) => {
    const result = await dispatch(unassignAsset({ id: asset._id, data: {} }));
    if (unassignAsset.fulfilled.match(result)) toast.success('Asset unassigned!');
    else toast.error(result.payload || 'Failed');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteAsset(deleteConfirm._id));
    if (deleteAsset.fulfilled.match(result)) {
      toast.success('Asset retired!');
      setDeleteConfirm(null);
    } else {
      toast.error(result.payload || 'Failed');
    }
  };

  const openHistory = (asset) => {
    setHistoryAsset(asset);
    dispatch(fetchAssetHistory(asset._id));
    setDrawerOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Asset', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <AssetImage
          src={row.imageUrl}
          alt={val}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          fallbackClassName="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0"
          iconSize={16}
        />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{val}</p>
          <p className="text-xs text-gray-400">{row.serialNumber}</p>
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', sortable: true, render: (val) => <Badge variant="primary">{val}</Badge> },
    { key: 'status', label: 'Status', render: (val) => <AssetStatusBadge status={val} /> },
    { key: 'assignedTo', label: 'Assigned To', render: (val) => val ? (
      <div className="flex items-center gap-2">
        <ProfileImage
          src={val.profileImage}
          name={val.name}
          className="w-6 h-6 rounded-full object-cover"
          fallbackClassName="w-6 h-6 bg-primary-100 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 flex items-center justify-center font-bold text-xs rounded-full flex-shrink-0"
        />
        <span className="text-sm">{val.name}</span>
      </div>
    ) : <span className="text-gray-400 text-sm">—</span> },
    { key: 'warrantyExpiry', label: 'Warranty', sortable: true, render: (val) => {
      if (!val) return <span className="text-gray-400">—</span>;
      const date = new Date(val);
      const expired = date < new Date();
      const soon = !expired && date < new Date(Date.now() + 30 * 86400000);
      return <span className={`text-sm ${expired ? 'text-red-500' : soon ? 'text-amber-500' : 'text-gray-600 dark:text-gray-400'}`}>{format(date, 'dd MMM yyyy')}</span>;
    }},
    { key: '_id', label: 'Actions', align: 'right', render: (_, row) => (
      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
        <button onClick={() => openHistory(row)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg" title="History">
          <History size={15} className="text-gray-500" />
        </button>
        <button onClick={() => { setSelected(row); setQrModalOpen(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-600 rounded-lg" title="QR Code">
          <QrCode size={15} className="text-gray-500" />
        </button>
        {canAssign && row.status === 'available' && (
          <button onClick={() => { setSelected(row); setAssignModalOpen(true); }} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Assign">
            <UserCheck size={15} className="text-green-500" />
          </button>
        )}
        {canAssign && row.status === 'assigned' && (
          <button onClick={() => handleUnassign(row)} className="p-1.5 hover:bg-amber-50 rounded-lg" title="Unassign">
            <UserX size={15} className="text-amber-500" />
          </button>
        )}
        {canManage && (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-primary-500 text-xs font-medium">Edit</button>
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 text-xs font-medium">Retire</button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Assets <span className="text-gray-400 font-normal text-base">({total})</span></h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all physical and hardware assets</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openAdd}>Add Asset</Button>}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            placeholder="Search assets..."
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <AssetTypeDropdown
          value={filters.type}
          onChange={val => setFilters(f => ({ ...f, type: val, page: 1 }))}
          placeholder="All Types"
          className="w-48"
        />
        <SearchableSelect
          value={filters.status}
          onChange={val => setFilters(f => ({ ...f, status: val, page: 1 }))}
          options={FILTER_STATUS_OPTIONS}
          placeholder="All Statuses"
          className="w-48"
        />
        <Button variant="ghost" onClick={() => setFilters({ type: '', status: '', search: '', page: 1 })}>Clear</Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={assets}
        loading={loading}
        emptyState={{ icon: Package, title: 'No assets found', description: 'Add your first asset to get started.' }}
        pagination={{ page, totalPages, total, limit: 20 }}
        onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Asset' : 'Add Asset'} size="lg" scrollable={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh] overflow-hidden bg-gray-50/30 dark:bg-dark-900/10">
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scroll scrollbar-thin">
            
            {/* Section 1: General Info */}
            <div className="space-y-5 bg-white dark:bg-dark-800 p-6 sm:p-8 rounded-2xl border border-gray-150/70 dark:border-dark-700/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-dark-700/60 pb-4">
                <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center flex-shrink-0 text-primary-500 shadow-sm">
                  <Info size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">General Information</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Basic details and identification of the asset</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Asset Name *</label>
                  <input 
                    {...register('name')} 
                    className={`w-full px-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`} 
                    placeholder="e.g. Dell Laptop XPS 15" 
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Type *</label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <AssetTypeDropdown
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select type"
                        error={errors.type?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Serial Number *</label>
                  <div className="relative">
                    <input 
                      {...register('serialNumber')} 
                      className={`w-full pl-10 pr-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.serialNumber ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`} 
                      placeholder="SN-XXXX-XXXX" 
                    />
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  </div>
                  {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Vendor</label>
                  <input 
                    {...register('vendor')} 
                    className="w-full px-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                    placeholder="e.g. Dell, HP, Lenovo" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Finances & Location */}
            <div className="space-y-5 bg-white dark:bg-dark-800 p-6 sm:p-8 rounded-2xl border border-gray-150/70 dark:border-dark-700/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-dark-700/60 pb-4">
                <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center flex-shrink-0 text-primary-500 shadow-sm">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Purchase & Location</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Tracking purchase dates, financials, and physical location</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Purchase Date</label>
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
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Warranty Expiry</label>
                  <Controller
                    name="warrantyExpiry"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select warranty expiry"
                        error={errors.warrantyExpiry?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Cost (₹)</label>
                  <div className="relative">
                    <input 
                      {...register('cost')} 
                      type="number" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                      placeholder="0" 
                    />
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Location</label>
                  <input 
                    {...register('location')} 
                    className="w-full px-4 py-2.5 bg-gray-50/40 dark:bg-dark-800/40 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm" 
                    placeholder="e.g. Floor 2, Room 201" 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Notes & Media */}
            <div className="space-y-5 bg-white dark:bg-dark-800 p-6 sm:p-8 rounded-2xl border border-gray-150/70 dark:border-dark-700/60 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-dark-700/60 pb-4">
                <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center flex-shrink-0 text-primary-500 shadow-sm">
                  <Package size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Notes & Asset Image</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Additional documentation and photos of the physical asset</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                  <textarea 
                    {...register('notes')} 
                    rows={3} 
                    className="w-full px-4 py-3 bg-gray-50/40 dark:bg-dark-800/40 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none text-sm" 
                    placeholder="Additional notes, specific settings, configuration specs..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Asset Image</label>
                  <FileUploader
                    onFileSelect={setImageFile}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                    hint="JPG, PNG up to 5MB"
                    currentUrl={selected?.imageUrl}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700/85 flex-shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 bg-[#F8F9FC] dark:bg-dark-700 hover:bg-[#F1F3F9] dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200/80 dark:border-dark-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300/20 shadow-sm"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={loading}
              className="px-6 py-2.5 !bg-primary-600 hover:!bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              {selected ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign: ${selected?.name}`} size="sm" overflowVisible={true}>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Select Employee</label>
            <SearchableSelect
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employeeOptions}
              placeholder="Choose employee..."
              searchPlaceholder="Search employees..."
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAssign} loading={loading} icon={UserCheck} className="flex-1 justify-center">Assign Asset</Button>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Asset QR Code" size="sm">
        {selected && (
          <div className="p-6 text-center space-y-4">
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner border border-gray-100">
              <QRCodeSVG value={selected.qrCode || `EAMS-${selected._id}-${selected.serialNumber}`} size={180} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{selected.name}</p>
              <p className="text-sm text-gray-500">{selected.serialNumber}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{selected.qrCode || `EAMS-${selected._id}-${selected.serialNumber}`}</p>
            </div>
            <Button variant="secondary" onClick={() => window.print()} className="w-full justify-center">Print Label</Button>
          </div>
        )}
      </Modal>

      {/* History Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={`History: ${historyAsset?.name}`} width="w-96">
        <div className="p-4 space-y-3">
          {history.length === 0 ? (
            <EmptyState icon={History} title="No history" description="No actions recorded for this asset." />
          ) : (
            history.map((h, i) => (
              <motion.div key={h._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex gap-3 pb-3 border-b border-gray-100 dark:border-dark-600 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-200">{h.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{h.performedBy?.name || 'System'}</p>
                  {h.notes && <p className="text-xs text-gray-400 mt-0.5">{h.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(h.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Drawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Retire Asset"
        message={`Are you sure you want to retire "${deleteConfirm?.name}"? This action will mark the asset as retired.`}
        confirmLabel="Retire"
        loading={loading}
      />
    </div>
  );
}
