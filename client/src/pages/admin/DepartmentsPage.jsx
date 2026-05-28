import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Users, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { departmentService } from '../../services/departmentService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog, EmptyState, Skeleton } from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { useSelector } from 'react-redux';

export default function DepartmentsPage() {
  const { user } = useSelector(s => s.auth);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const canManage = ['super_admin', 'hr_team'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try { const { data } = await departmentService.getAll(); setDepartments(data.data || []); }
    catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (dept) => {
    setSelected(dept);
    reset({ name: dept.name, code: dept.code, description: dept.description });
    setModalOpen(true);
  };

  const openAdd = () => { setSelected(null); reset({}); setModalOpen(true); };

  const onSubmit = async (data) => {
    try {
      if (selected) await departmentService.update(selected._id, data);
      else await departmentService.create(data);
      toast.success(selected ? 'Department updated!' : 'Department created!');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await departmentService.delete(deleteConfirm._id);
      toast.success('Department deactivated');
      setDeleteConfirm(null);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Departments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage organizational departments</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openAdd}>Add Department</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="card"><EmptyState icon={Building2} title="No departments" description="Create your first department." action={canManage && <Button icon={Plus} onClick={openAdd}>Add Department</Button>} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <motion.div key={dept._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -2 }} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white font-heading">{dept.name}</h3>
                    <Badge variant="primary">{dept.code}</Badge>
                  </div>
                </div>
              </div>
              {dept.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">{dept.description}</p>}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-dark-600">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={14} className="text-primary-500" />
                  <span><strong>{dept.employeeCount || 0}</strong> employees</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Package size={14} className="text-accent-500" />
                  <span><strong>{dept.assetCount || 0}</strong> assets</span>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(dept)} className="flex-1 text-xs text-center py-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors">Edit</button>
                  <button onClick={() => setDeleteConfirm(dept)} className="flex-1 text-xs text-center py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors">Deactivate</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Department' : 'Add Department'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Department Name *</label>
            <input {...register('name', { required: 'Name is required' })} className={`input ${errors.name ? 'border-red-400' : ''}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Department Code *</label>
            <input {...register('code', { required: 'Code is required' })} className={`input ${errors.code ? 'border-red-400' : ''}`} placeholder="e.g. IT, HR, FIN" />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Department purpose..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 justify-center">{selected ? 'Update' : 'Create'}</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Deactivate Department" message={`Deactivate "${deleteConfirm?.name}"?`} confirmLabel="Deactivate" />
    </div>
  );
}
