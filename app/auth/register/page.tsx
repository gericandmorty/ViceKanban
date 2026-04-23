'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Cookies from 'js-cookie';
import { API_URL } from '@/app/utils/api';
import Footer from '../../components/ui/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);

  // Debounced username check
  useEffect(() => {
    const trimmed = username.trim();
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    const startEndRegex = /^(?![._])(?!.*[._]$)/;
    const isBasicValid = trimmed.length >= 3 && !trimmed.includes(' ') && usernameRegex.test(trimmed) && startEndRegex.test(trimmed);

    if (!isBasicValid) {
      setUsernameExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(`${API_URL}/auth/check-username?username=${username.trim()}`);
        if (response.ok) {
          const data = await response.json();
          setUsernameExists(data.exists);
        }
      } catch (err) {
        console.error('Failed to check username availability');
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Sanitize inputs
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    
    // Safety checks
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    const startEndRegex = /^(?![._])(?!.*[._]$)/;

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      setIsLoading(false);
      return;
    }
    if (trimmedUsername.includes(' ')) {
      setError('Username cannot contain spaces.');
      setIsLoading(false);
      return;
    }
    if (!usernameRegex.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, dots, and underscores.');
      setIsLoading(false);
      return;
    }
    if (!startEndRegex.test(trimmedUsername)) {
      setError('Username cannot start or end with a dot or underscore.');
      setIsLoading(false);
      return;
    }
    if (usernameExists) {
      setError('Username is already taken.');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      Cookies.set('user_name', data.username, { expires: 1 });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30 text-foreground">
      <div className="flex-grow flex flex-col items-center pt-12 p-4">
        <Link href="/" className="mb-6 hover:opacity-80 transition-opacity">
          <Layout size={48} className="text-foreground" />
        </Link>

        <h1 className="text-2xl font-light tracking-tight mb-8">Join ViceKanBan</h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl px-4 flex flex-col md:flex-row gap-12"
        >
          <div className="flex-1 space-y-8 order-2 md:order-1">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">The developer's kanban.</h2>
              <p className="text-foreground/60">Built for individuals and small teams to ship fast and stay organized.</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1 h-12 bg-green-500 rounded-full self-center" />
                <div>
                  <h4 className="font-bold text-foreground">Simple by design</h4>
                  <p className="text-sm text-foreground/60">No complex configuration. Just cards and columns.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-12 bg-accent rounded-full self-center" />
                <div>
                  <h4 className="font-bold text-foreground">Team ready</h4>
                  <p className="text-sm text-foreground/60">Invite colleagues and collaborate in real-time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 order-1 md:order-2">
            <div className="bg-background border border-border-default rounded-md p-6 shadow-sm">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <CheckCircle2 size={48} className="text-green-500 mb-4" />
                  <h3 className="text-xl font-bold">Registration Successful!</h3>
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      A confirmation email has been sent successfully. <br/>
                      Please check the email associated with your account to verify your identity.
                    </p>
                    <div className="pt-4 border-t border-border-default">
                      <Link 
                        href="/auth/login" 
                        className="btn btn-primary w-full py-2 block text-center"
                      >
                        Go to Sign in
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500 text-xs">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        maxLength={16}
                        className={`w-full bg-background border rounded-md py-[5px] px-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-foreground/40 ${
                          usernameExists 
                            ? 'border-red-500/50 focus:ring-red-500/20' 
                            : 'border-border-default focus:ring-accent/40 focus:border-accent'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername ? (
                          <Loader2 size={14} className="animate-spin text-foreground/40" />
                        ) : (username.trim().length >= 3 && !username.includes(' ') && /^[a-zA-Z0-9._]+$/.test(username)) && (
                          usernameExists ? (
                            <AlertCircle size={14} className="text-red-500" />
                          ) : (
                            <CheckCircle2 size={14} className="text-green-500" />
                          )
                        )}
                      </div>
                    </div>
                    {usernameExists && <p className="text-[10px] text-red-500">Username is already taken.</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={50}
                      className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all placeholder:text-foreground/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-normal">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        maxLength={18}
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
                    <p className="text-[11px] text-foreground/40">8-18 chars, 1 uppercase, 1 special/number required.</p>
                  </div>

                  <p className="text-[11px] text-foreground/40 py-2">
                    By creating an account, you agree to the <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-1.5 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-foreground/60">Already have an account? </span>
              <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
