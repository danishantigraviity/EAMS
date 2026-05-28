import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 dark:bg-dark-600 hover:bg-gray-200 dark:hover:bg-dark-500 text-gray-700 dark:text-gray-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md',
  ghost: 'hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400',
  accent: 'bg-accent-400 hover:bg-accent-500 text-white shadow-sm hover:shadow-md',
  outline: 'border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
      {iconRight && !loading && <span className="ml-1">{iconRight}</span>}
    </motion.button>
  );
}
