'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, Loader2, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import Cookies from 'js-cookie';
import { setObfuscatedCookie } from '@/app/utils/cookieUtils';
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
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [banCooldown, setBanCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (banCooldown > 0) {
      const timer = setTimeout(() => setBanCooldown(banCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [banCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Sanitize inputs
    const trimmedEmail = email.trim();

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isEmailUnconfirmed) {
          setIsUnconfirmed(true);
        }
        if (data.isIpBanned) {
          setBanCooldown(data.banTtl);
          const msg = `Too many failed attempts. Please try again in ${data.banTtl} seconds.`;
          throw new Error(msg);
        }
        
        // Handle string or array messages from NestJS
        const rawMessage = data.message;
        const errorMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
        throw new Error(errorMessage || 'Login failed');
      }

      // Store auth info
      const expiryTime = Date.now() + 8 * 60 * 60 * 1000; // 8 hours from now
      Cookies.set('access_token', data.access_token, { expires: 1 / 3 }); // ~8 hours
      setObfuscatedCookie('user_name', data.username, { expires: 1 / 3 });
      setObfuscatedCookie('user_id', data.userId, { expires: 1 / 3 });
      localStorage.setItem('session_expiry', expiryTime.toString());

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (cooldown > 0) return;
    setResendStatus({ loading: true, message: '' });
    try {
      const response = await fetch(`${API_URL}/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResendStatus({ loading: false, message: data.message });
      setCooldown(60); // 60s cooldown
    } catch (err) {
      setResendStatus({ loading: false, message: 'Failed to resend. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30">
      <div className="flex-grow flex flex-col items-center pt-12 p-4">
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
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-md flex items-center gap-2 text-accent text-xs mb-4">
                  <Clock size={14} className="shrink-0" />
                  <span>Session timed out. Please login again.</span>
                </div>
              )}

              {error && (
                <div className="space-y-2 mb-4">
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500 text-xs text-center justify-center">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>
                      {banCooldown > 0 
                        ? `Too many failed attempts. Please try again in ${banCooldown} seconds.`
                        : error}
                    </span>
                  </div>

                  {isUnconfirmed && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendStatus.loading || cooldown > 0}
                        className="text-xs text-accent hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-1 mx-auto"
                      >
                        {resendStatus.loading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Sending...
                          </>
                        ) : cooldown > 0 ? (
                          <>
                            <Clock size={12} />
                            Resend in {cooldown}s
                          </>
                        ) : (
                          'Resend confirmation email?'
                        )}
                      </button>
                      {resendStatus.message && (
                        <p className="text-[10px] text-foreground/60 mt-1">{resendStatus.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-normal text-foreground">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all placeholder:text-foreground/40"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
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
            <span className="text-foreground/60">New to ViceKanBan?</span>
            <Link href="/auth/register" className="text-accent hover:underline">Create an account</Link>
          </div>
        </motion.div>
      </div>

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
