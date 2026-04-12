'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Footer from '../../components/ui/Footer';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Please check your email link again.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { API_URL } = await import('@/app/utils/api');
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center pt-12 p-4 font-sans selection:bg-accent/30">
      <Link href="/" className="mb-6 hover:opacity-80 transition-opacity">
        <Layout size={48} className="text-foreground" />
      </Link>

      <h1 className="text-2xl font-light tracking-tight text-foreground mb-4">Set a new password</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[308px]"
      >
        <div className="bg-background border border-border-default rounded-md p-4 shadow-sm">
          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-md flex items-center gap-2 text-red-800 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-normal text-foreground">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={18}
                    disabled={!token}
                    className="w-full bg-background border border-border-default rounded-md py-[5px] pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">8-18 chars, 1 uppercase, 1 special/number required.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-normal text-foreground">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    maxLength={18}
                    disabled={!token}
                    className="w-full bg-background border border-border-default rounded-md py-[5px] pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="btn btn-primary w-full py-1.5 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  'Change password'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex flex-col items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <p>Password changed! Redirecting to login...</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-bg-subtle flex flex-col items-center pt-12 p-4 font-sans">
          <Loader2 size={32} className="animate-spin text-accent mt-20" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
