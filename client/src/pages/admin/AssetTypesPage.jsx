import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Package, Trash2, Edit3, Check, Loader2,
  Laptop, Monitor, Tv, Armchair, Table, Printer, Wifi, Cctv,
  Smartphone, Keyboard, Mouse, Cpu, Server, Projector,
  Phone, Tablet, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { assetTypeService } from '../../services/assetTypeService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog, EmptyState } from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import SearchableSelect from '../../components/ui/SearchableSelect';

const iconList = [
  { name: 'Laptop', component: Laptop },
  { name: 'Monitor', component: Monitor },
  { name: 'Tv', component: Tv, label: 'TV Display' },
  { name: 'Chair', component: Armchair, label: 'Chair/Seat' },
  { name: 'Table', component: Table, label: 'Desk/Table' },
  { name: 'Printer', component: Printer },
  { name: 'Wifi', component: Wifi, label: 'Network/Wifi' },
  { name: 'Cctv', component: Cctv, label: 'CCTV Camera' },
  { name: 'Smartphone', component: Smartphone, label: 'Mobile Phone' },
  { name: 'Keyboard', component: Keyboard },
  { name: 'Mouse', component: Mouse },
  { name: 'Cpu', component: Cpu, label: 'UPS/Power' },
  { name: 'Server', component: Server },
  { name: 'Projector', component: Projector },
  { name: 'Phone', component: Phone, label: 'Desk Phone' },
  { name: 'Tablet', component: Tablet },
  { name: 'HelpCircle', component: HelpCircle, label: 'Other/Generic' },
];

const categoryList = ['IT Devices', 'Office Furniture', 'Network Devices', 'Accessories', 'Other'];

export default function AssetTypesPage() {
  const { user } = useSelector(s => s.auth);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('Package');

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();
  const canManage = ['super_admin', 'it_team'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await assetTypeService.getAll(true); // force refresh
      setAssetTypes(data.data || []);
    } catch {
      toast.error('Failed to load asset types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (type) => {
    setSelected(type);
    setSelectedIcon(type.icon || 'Package');
    reset({
      name: type.name,
      code: type.code,
      category: type.category,
      description: type.description
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setSelected(null);
    setSelectedIcon('Laptop');
    reset({
      name: '',
      code: '',
      category: 'IT Devices',
      description: ''
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      icon: selectedIcon
    };

    try {
      if (selected) {
        await assetTypeService.update(selected._id, payload);
        toast.success('Asset type updated!');
      } else {
        await assetTypeService.create(payload);
        toast.success('Asset type created!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save asset type');
    }
  };

  const handleDelete = async () => {
    try {
      await assetTypeService.delete(deleteConfirm._id);
      toast.success('Asset type deleted');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Helper to render icon component dynamically
  const renderIcon = (iconName, className = 'text-primary-500') => {
    const found = iconList.find(i => i.name === iconName);
    const IconComp = found ? found.component : Package;
    return <IconComp size={18} className={className} />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Asset Types</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure global categories and specifications of asset types</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openAdd}>Add Asset Type</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="skeleton h-36 rounded-2xl animate-pulse bg-gray-200 dark:bg-dark-700" />
          ))}
        </div>
      ) : assetTypes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="No asset types"
            description="Create your first asset type category."
            action={canManage && <Button icon={Plus} onClick={openAdd}>Add Asset Type</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assetTypes.map((type, i) => (
            <motion.div
              key={type._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center border border-primary-100/50 dark:border-primary-900/20">
                      {renderIcon(type.icon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white font-heading text-sm sm:text-base leading-tight">
                        {type.name}
                      </h3>
                      <Badge variant="secondary" className="mt-1">{type.category}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-xs text-gray-400">
                    Code: <code className="bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">{type.code}</code>
                  </p>
                  {type.description ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                      {type.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-2">No description provided.</p>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                  <button
                    onClick={() => openEdit(type)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg font-medium transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(type)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg font-medium transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Edit Asset Type' : 'Add Asset Type'}
        size="md"
        scrollable={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh] overflow-hidden bg-gray-50/20 dark:bg-dark-900/10">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 modal-scroll scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Asset Type Name *</label>
                {(() => {
                  const nameReg = register('name', { required: 'Name is required' });
                  return (
                    <input
                      {...nameReg}
                      placeholder="e.g. Macbook Pro, Office Desk"
                      className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`}
                      onChange={(e) => {
                        nameReg.onChange(e);
                        // Auto-generate code from name if adding
                        if (!selected) {
                          setValue('code', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
                        }
                      }}
                    />
                  );
                })()}
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Type Code (lowercase, unique) *</label>
                <input
                  {...register('code', {
                    required: 'Code is required',
                    pattern: { value: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, and underscores allowed' }
                  })}
                  placeholder="e.g. laptop, office_desk"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.code ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Category *</label>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={categoryList.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select category"
                    searchable={false}
                    error={errors.category?.message}
                  />
                )}
              />
            </div>

            {/* Visual Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Display Icon *</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 bg-gray-50/50 dark:bg-dark-900/20 p-4 rounded-2xl border border-gray-150/70 dark:border-dark-750 max-h-[180px] overflow-y-auto modal-scroll scrollbar-thin">
                {iconList.map((icon) => {
                  const IconComp = icon.component;
                  const isSelected = selectedIcon === icon.name;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      title={icon.label || icon.name}
                      onClick={() => setSelectedIcon(icon.name)}
                      className={`h-14 flex flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm shadow-primary-500/10 scale-[1.03] ring-1 ring-primary-500/20'
                          : 'bg-white dark:bg-dark-800 border-gray-200/60 dark:border-dark-750 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-750/50 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <IconComp size={18} className={isSelected ? 'text-primary-500' : 'text-gray-400'} />
                      <span className="text-[10px] mt-1.5 font-semibold truncate max-w-full px-1.5 select-none leading-none">
                        {icon.label || icon.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200/80 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
                placeholder="Short description of this asset type..."
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex-shrink-0">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F8F9FC] border border-gray-200/80 hover:bg-[#F1F3F9] dark:bg-dark-900/40 dark:border-dark-700 dark:hover:bg-dark-900/60 text-gray-700 dark:text-gray-300 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold !bg-primary-600 hover:!bg-primary-700 text-white shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
            >
              {selected ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Asset Type"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.name}"? Any active assets of this type will prevent deletion to protect data consistency.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
