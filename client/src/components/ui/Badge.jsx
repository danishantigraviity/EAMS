const variants = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
  accent: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400',
};

export default function Badge({ children, variant = 'gray', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-green-500' : variant === 'warning' ? 'bg-amber-500' : variant === 'danger' ? 'bg-red-500' : variant === 'info' ? 'bg-blue-500' : 'bg-gray-500'}`} />}
      {children}
    </span>
  );
}

export function AssetStatusBadge({ status }) {
  const map = {
    available: { variant: 'success', label: 'Available' },
    assigned: { variant: 'info', label: 'Assigned' },
    damaged: { variant: 'danger', label: 'Damaged' },
    maintenance: { variant: 'warning', label: 'In Maintenance' },
    retired: { variant: 'gray', label: 'Retired' },
  };
  const cfg = map[status] || { variant: 'gray', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

export function LicenseStatusBadge({ expiryDate }) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);

  if (expiry < now) return <Badge variant="danger" dot>Expired</Badge>;
  if (expiry <= thirtyDays) return <Badge variant="warning" dot>Expiring Soon</Badge>;
  return <Badge variant="success" dot>Active</Badge>;
}

export function PriorityBadge({ priority }) {
  const map = { low: 'success', medium: 'warning', high: 'danger' };
  return <Badge variant={map[priority] || 'gray'}>{priority?.charAt(0).toUpperCase() + priority?.slice(1)}</Badge>;
}

export function RoleBadge({ role }) {
  const map = {
    super_admin: 'danger', hr_team: 'info', it_team: 'primary',
    sbi_team: 'accent', insurance_team: 'warning', business_associate: 'gray', employee: 'gray',
  };
  const label = role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <Badge variant={map[role] || 'gray'}>{label}</Badge>;
}
