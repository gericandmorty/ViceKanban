'use client';

import React, { useState } from 'react';
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = API_URL;
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      Cookies.set('user_name', data.username, { expires: 1 });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col items-center pt-12 p-4 font-sans selection:bg-accent/30 text-foreground">
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
            <p className="text-zinc-500">Built for individuals and small teams to ship fast and stay organized.</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1 h-12 bg-success rounded-full self-center" />
              <div>
                <h4 className="font-bold">Simple by design</h4>
                <p className="text-sm text-zinc-500">No complex configuration. Just cards and columns.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-1 h-12 bg-accent rounded-full self-center" />
              <div>
                <h4 className="font-bold">Team ready</h4>
                <p className="text-sm text-zinc-500">Invite colleagues and collaborate in real-time.</p>
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
                <CheckCircle2 size={48} className="text-success mb-4" />
                <h3 className="text-lg font-bold">Successfully Registered!</h3>
                <p className="text-sm text-zinc-500 mt-2">Redirecting you to sign in...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-200 rounded-md flex items-center gap-2 text-red-800 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-normal">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-normal">Email address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-background border border-border-default rounded-md py-[5px] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
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
                  <p className="text-[11px] text-zinc-500">8+ chars, 1 uppercase, 1 special/number required.</p>
                </div>

                <p className="text-[11px] text-zinc-500 py-2">
                  By creating an account, you agree to the <Link href="#" className="text-accent hover:underline">Terms of Service</Link> and <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>.
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
            <span className="text-zinc-500">Already have an account? </span>
            <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
