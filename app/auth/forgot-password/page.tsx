'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layout, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { API_URL } = await import('@/app/utils/api');
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');
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

      <h1 className="text-2xl font-light tracking-tight text-foreground mb-4">Reset your password</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[308px]"
      >
        <div className="bg-background border border-border-default rounded-md p-4 shadow-sm">
          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-foreground/80 mb-2">
                Enter your user account's verified email address and we will send you a password reset link.
              </p>

              {error && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-md flex items-center gap-2 text-red-800 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-normal text-foreground">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-1.5 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  'Send password reset email'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex flex-col items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <p>Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 border border-border-default rounded-md flex items-center justify-center gap-2 text-sm text-foreground">
          <span>Remember your password?</span>
          <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
        </div>
      </motion.div>

      <footer className="mt-auto py-10 flex gap-6 text-[12px] text-zinc-500">
        <Link href="#" className="hover:text-accent hover:underline">Terms</Link>
        <Link href="#" className="hover:text-accent hover:underline">Privacy</Link>
        <Link href="#" className="hover:text-accent hover:underline">Security</Link>
        <Link href="#" className="hover:text-zinc-800 transition-colors">Contact ViceKanBan</Link>
      </footer>
    </div>
  );
}
