'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Layout } from 'lucide-react';
import { API_URL } from '@/app/utils/api';
import Link from 'next/link';
import Footer from '../../components/ui/Footer';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const isVerifying = React.useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || isVerifying.current) return;
      isVerifying.current = true;
      
      setStatus('loading');
      setMessage('Verifying your email address...');

      try {
        const response = await fetch(`${API_URL}/auth/confirm-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          // If already confirmed, treat as success but with a different message
          const errorMsg = data.message?.toLowerCase() || '';
          if (errorMsg.includes('already confirmed') || errorMsg.includes('already been used')) {
            setStatus('success');
            setMessage("You've already verified your email, redirecting you to login...");
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
          } else {
            setStatus('error');
            setMessage(data.message || 'Verification failed. The link may have expired.');
          }
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to connect to the server. Please try again later.');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid confirmation link. No token provided.');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30">
      <div className="flex-grow flex flex-col items-center pt-12 p-4">
        <Link href="/" className="mb-6 hover:opacity-80 transition-opacity">
          <Layout size={48} className="text-foreground" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[308px]"
        >
          <div className="bg-background border border-border-default rounded-md p-6 shadow-sm text-center">
            {status === 'loading' && (
              <div className="py-4 space-y-4">
                <Loader2 className="animate-spin text-accent mx-auto" size={24} />
                <p className="text-sm font-medium text-foreground/60">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-2 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="text-green-500" size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-light tracking-tight text-foreground">Email Verified</h2>
                  <p className="text-xs text-foreground/60">{message}</p>
                </div>
                <div className="pt-2">
                  <div className="h-1 w-full bg-border-default rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: "linear" }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="py-2 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="text-red-500" size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-light tracking-tight text-foreground">Verification Failed</h2>
                  <p className="text-xs text-red-500/80 leading-relaxed px-4">{message}</p>
                </div>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="btn btn-primary w-full py-1.5 mt-2 transition-all hover:bg-accent/90"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 border border-border-default rounded-md flex items-center justify-center gap-2 text-sm text-foreground/60">
            <span>Need help?</span>
            <Link href="/about" className="text-accent hover:underline">Contact support</Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-500" size={32} />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
