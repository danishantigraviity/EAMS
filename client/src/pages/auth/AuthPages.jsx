import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(yup.object({ email: yup.string().email().required('Email is required') }))
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl items-center justify-center mb-4">
              <Mail size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold font-heading">{sent ? 'Check Your Email' : 'Forgot Password'}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {sent ? 'We sent a 6-digit OTP to your email.' : 'Enter your email to receive a reset OTP.'}
            </p>
          </div>
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input {...register('email')} type="email" placeholder="you@company.com" className={`input ${errors.email ? 'border-red-400' : ''}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <Button type="submit" loading={loading} className="w-full justify-center">Send OTP</Button>
            </form>
          ) : (
            <div className="text-center">
              <Link to="/verify-otp" className="btn-primary inline-flex w-full justify-center">Enter OTP</Link>
            </div>
          )}
          <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-6 justify-center">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function VerifyOTPPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/\D/, '');
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    const email = sessionStorage.getItem('reset_email');
    setLoading(true);
    try {
      const { data } = await authService.verifyOTP({ email, otp: code });
      sessionStorage.setItem('reset_token', data.data.resetToken);
      toast.success('OTP verified!');
      navigate('/reset-password');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl items-center justify-center mb-4">
              <ShieldCheck size={24} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold font-heading">Verify OTP</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter the 6-digit code sent to your email.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e.target.value, idx)}
                  onKeyDown={e => e.key === 'Backspace' && !digit && idx > 0 && document.getElementById(`otp-${idx - 1}`)?.focus()}
                  className="w-12 h-12 text-center text-xl font-bold input"
                />
              ))}
            </div>
            <Button type="submit" loading={loading} className="w-full justify-center">Verify OTP</Button>
          </form>
          <Link to="/forgot-password" className="flex items-center gap-2 text-sm text-gray-500 mt-4 justify-center hover:text-gray-700 dark:text-gray-400">
            <ArrowLeft size={14} /> Resend OTP
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(yup.object({
      newPassword: yup.string().min(8).matches(/[A-Z]/, 'Must have uppercase').matches(/[0-9]/, 'Must have number').required(),
      confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required(),
    }))
  });

  const onSubmit = async ({ newPassword }) => {
    const email = sessionStorage.getItem('reset_email');
    const resetToken = sessionStorage.getItem('reset_token');
    setLoading(true);
    try {
      await authService.resetPassword({ email, resetToken, newPassword });
      sessionStorage.removeItem('reset_token');
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl items-center justify-center mb-4">
              <KeyRound size={24} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold font-heading">Reset Password</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input {...register('newPassword')} type={show ? 'text' : 'password'} className={`input pr-10 ${errors.newPassword ? 'border-red-400' : ''}`} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className={`input ${errors.confirmPassword ? 'border-red-400' : ''}`} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" loading={loading} className="w-full justify-center">Reset Password</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
