import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, FolderOpen, Trash2, Edit3, Loader2,
  Sparkles, Image as Img, Film, FileText, Presentation, Megaphone, Code, Table, File, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { digitalAssetCategoryService } from '../../services/digitalAssetCategoryService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog, EmptyState } from '../../components/ui/StatCard';

const iconList = [
  { name: 'Sparkles', component: Sparkles, label: 'Logo / Sparkles' },
  { name: 'Image', component: Img, label: 'Image / Graphic' },
  { name: 'Film', component: Film, label: 'Video / Film' },
  { name: 'FileText', component: FileText, label: 'Document / PDF' },
  { name: 'Presentation', component: Presentation, label: 'PPT / Slides' },
  { name: 'Megaphone', component: Megaphone, label: 'Marketing' },
  { name: 'Code', component: Code, label: 'Source Code' },
  { name: 'Table', component: Table, label: 'Spreadsheet' },
  { name: 'File', component: File, label: 'Other File' }
];

const iconMap = {
  Sparkles, Image: Img, Film, FileText, Presentation, Megaphone, Code, Table, File
};

export default function DigitalAssetCategoriesPage() {
  const { user } = useSelector(s => s.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState('FileText');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const canManage = ['super_admin', 'it_team'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await digitalAssetCategoryService.getAll();
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load digital asset categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (category) => {
    setSelected(category);
    setSelectedIcon(category.icon || 'FileText');
    reset({
      name: category.name,
      code: category.code,
      description: category.description
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    setSelected(null);
    setSelectedIcon('FileText');
    reset({
      name: '',
      code: '',
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
        await digitalAssetCategoryService.update(selected._id, payload);
        toast.success('Category updated successfully!');
      } else {
        await digitalAssetCategoryService.create(payload);
        toast.success('Category created successfully!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async () => {
    try {
      await digitalAssetCategoryService.delete(deleteConfirm._id);
      toast.success('Category deleted successfully');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const renderIcon = (iconName, className = 'text-primary-500') => {
    const IconComp = iconMap[iconName] || File;
    return <IconComp size={18} className={className} />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Digital Asset Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure global metadata tags and categories for cloud digital assets</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openAdd}>Add Category</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="skeleton h-36 rounded-2xl animate-pulse bg-gray-200 dark:bg-dark-700" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderOpen}
            title="No digital asset categories"
            description="Create your first digital asset category."
            action={canManage && <Button icon={Plus} onClick={openAdd}>Add Category</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category, i) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center border border-primary-100/50 dark:border-primary-900/20">
                      {renderIcon(category.icon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white font-heading text-sm sm:text-base leading-tight">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-xs text-gray-400">
                    Code: <code className="bg-gray-100 dark:bg-dark-700 px-1.5 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">{category.code}</code>
                  </p>
                  {category.description ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-2">No description provided.</p>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-700">
                  <button
                    onClick={() => openEdit(category)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg font-medium transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(category)}
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
        title={selected ? 'Edit Category' : 'Add Category'}
        size="md"
        scrollable={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh] overflow-hidden bg-gray-50/20 dark:bg-dark-900/10">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 modal-scroll scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Category Name *</label>
                {(() => {
                  const nameReg = register('name', { required: 'Name is required' });
                  return (
                    <input
                      {...nameReg}
                      placeholder="e.g. PPT/Slides"
                      className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`}
                      onChange={(e) => {
                        nameReg.onChange(e);
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
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Category Code (lowercase, unique) *</label>
                <input
                  {...register('code', {
                    required: 'Code is required',
                    pattern: { value: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, and underscores allowed' }
                  })}
                  placeholder="e.g. ppt"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm ${errors.code ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200/80 dark:border-dark-700'}`}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
              </div>
            </div>

            {/* Visual Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Display Icon *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/50 dark:bg-dark-900/20 p-4 rounded-2xl border border-gray-150/70 dark:border-dark-750 max-h-[220px] overflow-y-auto modal-scroll scrollbar-thin">
                {iconList.map((icon) => {
                  const IconComp = icon.component;
                  const isSelected = selectedIcon === icon.name;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      title={icon.label || icon.name}
                      onClick={() => setSelectedIcon(icon.name)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 text-primary-600 dark:text-primary-400 shadow-sm shadow-primary-500/10 scale-[1.02] ring-1 ring-primary-500/10'
                          : 'bg-white dark:bg-dark-800 border-gray-200/60 dark:border-dark-750 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-750/50 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                        <IconComp size={16} />
                      </div>
                      <span className="text-xs font-semibold select-none leading-none truncate pr-1">
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
                placeholder="Short description of this category..."
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
        title="Delete Category"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.name}"? Any active digital assets of this category will prevent deletion to protect data consistency.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
