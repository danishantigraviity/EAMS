import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { loginUser, clearError } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(1, 'Password is required').required('Password is required'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user.role;
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      navigate(role === 'employee' ? '/my-dashboard' : '/dashboard');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-dark-900 selection:bg-primary-500/20">
      {/* Left Panel: Visual Identity & Hero Illustration */}
      <div className="hidden md:flex relative w-1/2 min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-500 via-indigo-600 to-primary-800 dark:from-dark-900 dark:via-dark-800 dark:to-dark-950">
        {/* Atmospheric Blur Shapes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Floating Glassmorphic Illustration Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/10 dark:bg-dark-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-3xl shadow-2xl text-white"
          >
            {/* Minimal Node Graphic */}
            <div className="w-full h-48 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-accent-500/30 border border-white/15 flex items-center justify-center overflow-hidden">
              <svg className="w-28 h-28 text-white opacity-85" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="2.5" className="animate-pulse" />
                <path d="M50 20 V40 M50 60 V80 M20 50 H40 M60 50 H80" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="50" cy="15" r="5" fill="currentColor" />
                <circle cx="50" cy="85" r="5" fill="currentColor" />
                <circle cx="15" cy="50" r="5" fill="currentColor" />
                <circle cx="85" cy="50" r="5" fill="currentColor" />
                <path d="M25 25 L40 40 M75 25 L60 40 M25 75 L40 60 M75 75 L60 60" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
                <circle cx="80" cy="20" r="3" fill="currentColor" opacity="0.5" />
                <circle cx="20" cy="80" r="3" fill="currentColor" opacity="0.5" />
                <circle cx="80" cy="80" r="3" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold font-heading">Technical Precision</h3>
            <p className="text-indigo-100/80 text-sm mt-3 leading-relaxed">
              Managing enterprise assets with calculated clarity, real-time tracking, and frosted elegance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Login Form Screen */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-dark-900 min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] bg-white/60 dark:bg-dark-800/40 backdrop-blur-xl border border-gray-100 dark:border-dark-700/50 p-8 md:p-10 rounded-3xl shadow-xl flex flex-col"
        >
          {/* Centered Logo Container */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex w-36 h-16 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700/60 rounded-2xl items-center justify-center p-2.5 mb-4 shadow-md overflow-hidden"
            >
              <img src={logo} alt="EAMS Logo" className="max-w-full max-h-full object-contain object-center" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading tracking-tight">Welcome Back</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-800/50 border rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.email ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : 'border-gray-200 dark:border-dark-600'
                  }`}
                  autoComplete="email"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs mt-1 px-1 font-medium"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 bg-white dark:bg-dark-800/50 border rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.password ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : 'border-gray-200 dark:border-dark-600'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs mt-1 px-1 font-medium"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 dark:border-dark-600 text-primary-500 focus:ring-primary-500/30 transition-all cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary-500 transition-colors">
                  Remember device
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            {/* Redux State API Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl px-4 py-3"
                >
                  <p className="text-red-600 dark:text-red-400 text-xs font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In CTA */}
            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 text-sm font-semibold transition-all"
            >
              Sign In
            </Button>
          </form>

          {/* Contact Admin */}
          <div className="pt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                Contact System Admin
              </a>
            </p>
          </div>

          {/* Footnote Links */}
          <div className="mt-auto pt-8 flex justify-center space-x-6">
            <a href="#" className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
