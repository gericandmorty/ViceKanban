'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, Loader2, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import Cookies from 'js-cookie';
import { API_URL } from '@/app/utils/api';
import Footer from '../../components/ui/Footer';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get('timeout') === 'true';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store auth info
      const expiryTime = Date.now() + 8 * 60 * 60 * 1000; // 8 hours from now
      Cookies.set('access_token', data.access_token, { expires: 1/3 }); // ~8 hours
      Cookies.set('user_name', data.username, { expires: 1/3 });
      Cookies.set('user_id', data.userId, { expires: 1/3 });
      localStorage.setItem('session_expiry', expiryTime.toString());
      
      router.push('/dashboard');
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

      <h1 className="text-2xl font-light tracking-tight text-foreground mb-4">Sign in to ViceKanBan</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[308px]"
      >
        <div className="bg-background border border-border-default rounded-md p-4 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {isTimeout && !error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-800 text-xs mb-4 animate-shake">
                <Clock size={14} className="shrink-0" />
                <span>Session timed out. Please login again.</span>
              </div>
            )}
            
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
                className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-normal text-foreground">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-border-default rounded-md py-[5px] pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-1.5 mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 p-4 border border-border-default rounded-md flex items-center justify-center gap-2 text-sm text-foreground">
          <span>New to ViceKanBan?</span>
          <Link href="/auth/register" className="text-accent hover:underline">Create an account</Link>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
