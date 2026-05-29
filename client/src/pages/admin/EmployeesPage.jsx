import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Plus, Users, Search, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../features/employees/employeeSlice';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge, { RoleBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/StatCard';
import FileUploader from '../../components/ui/FileUploader';
import SearchableSelect from '../../components/ui/SearchableSelect';
import ProfileImage from '../../components/ui/ProfileImage';

const ROLES = ['super_admin','hr_team','it_team','sbi_team','insurance_team','business_associate','employee'];

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Valid email required').required('Email is required'),
  password: yup.string().when('$isEdit', { is: false, then: s => s.min(8).matches(/[A-Z]/, 'Must have uppercase').matches(/[0-9]/, 'Must have number').required('Password is required') }),
  role: yup.string().required('Role is required'),
  phone: yup.string(),
  employeeId: yup.string(),
});

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const { items: employees, loading, total, page, totalPages } = useSelector(s => s.employees);
  const { user } = useSelector(s => s.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', page: 1, limit: 20 });

  const canManage = ['super_admin', 'hr_team'].includes(user?.role);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit: !!selected },
  });

  useEffect(() => { dispatch(fetchEmployees(filters)); }, [dispatch, filters]);

  const openAdd = () => { reset({ role: 'employee' }); setSelected(null); setImageFile(null); setModalOpen(true); };
  const openEdit = (emp) => {
    setSelected(emp);
    reset({ name: emp.name, email: emp.email, role: emp.role, phone: emp.phone || '', employeeId: emp.employeeId || '' });
    setImageFile(null);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    if (imageFile) fd.append('profileImage', imageFile);

    let result;
    if (selected) result = await dispatch(updateEmployee({ id: selected._id, data: fd }));
    else result = await dispatch(createEmployee(fd));

    if (createEmployee.fulfilled.match(result) || updateEmployee.fulfilled.match(result)) {
      toast.success(selected ? 'Employee updated!' : 'Employee created!');
      setModalOpen(false);
    } else {
      toast.error(result.payload || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteEmployee(deleteConfirm._id));
    if (deleteEmployee.fulfilled.match(result)) { toast.success('Employee deactivated!'); setDeleteConfirm(null); }
    else toast.error(result.payload || 'Failed');
  };

  const columns = [
    { key: 'name', label: 'Employee', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-3">
        <ProfileImage
          src={row.profileImage}
          name={val}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          fallbackClassName="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
        />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{val}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (val) => <RoleBadge role={val} /> },
    { key: 'department', label: 'Department', render: (val) => val ? <Badge variant="gray">{val.name}</Badge> : <span className="text-gray-400 text-sm">—</span> },
    { key: 'phone', label: 'Phone', render: (val) => val ? <span className="text-sm flex items-center gap-1"><Phone size={12} className="text-gray-400" />{val}</span> : <span className="text-gray-400">—</span> },
    { key: 'isActive', label: 'Status', render: (val) => <Badge variant={val ? 'success' : 'gray'} dot>{val ? 'Active' : 'Inactive'}</Badge> },
    { key: 'employeeId', label: 'EMP ID', render: (val) => val ? <span className="font-mono text-xs bg-gray-100 dark:bg-dark-600 px-2 py-0.5 rounded">{val}</span> : <span className="text-gray-400">—</span> },
    { key: '_id', label: 'Actions', align: 'right', render: (_, row) => (
      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
        {canManage && (
          <>
            <button onClick={() => openEdit(row)} className="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">Edit</button>
            {row.isActive && <button onClick={() => setDeleteConfirm(row)} className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Deactivate</button>}
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Employees <span className="text-gray-400 font-normal text-base">({total})</span></h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage organization members and access roles</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openAdd}>Add Employee</Button>}
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} placeholder="Search employees..." className="input pl-9 py-2 text-sm" />
        </div>
        <SearchableSelect
          value={filters.role}
          onChange={val => setFilters(f => ({ ...f, role: val, page: 1 }))}
          options={[
            { value: '', label: 'All Roles' },
            ...ROLES.map(r => ({
              value: r,
              label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            }))
          ]}
          searchable={false}
          placeholder="All Roles"
          className="w-44"
        />
        <Button variant="ghost" onClick={() => setFilters({ search: '', role: '', page: 1, limit: 20 })}>Clear</Button>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyState={{ icon: Users, title: 'No employees found', description: 'Add your first employee.' }}
        pagination={{ page, totalPages, total, limit: 20 }}
        onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('name')} className={`input ${errors.name ? 'border-red-400' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input {...register('email')} type="email" className={`input ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            {!selected && (
              <div>
                <label className="label">Password *</label>
                <input {...register('password')} type="password" className={`input ${errors.password ? 'border-red-400' : ''}`} placeholder="Min 8 chars, 1 uppercase, 1 number" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div>
              <label className="label">Role *</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ROLES.map(r => ({
                      value: r,
                      label: r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    }))}
                    searchable={false}
                    placeholder="Select role"
                    error={errors.role?.message}
                  />
                )}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 XXXXX XXXXX" />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input {...register('employeeId')} className="input" placeholder="EMP001" />
            </div>
          </div>
          <div>
            <label className="label">Profile Photo</label>
            <FileUploader onFileSelect={setImageFile} accept={{ 'image/*': [] }} hint="JPG, PNG up to 2MB" currentUrl={selected?.profileImage} variant="avatar" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 justify-center">{selected ? 'Update' : 'Create'} Employee</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Deactivate Employee" message={`Deactivate "${deleteConfirm?.name}"? They will lose access to the system.`} confirmLabel="Deactivate" loading={loading} />
    </div>
  );
}
