'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/app/utils/api';
import { Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '@/app/components/ui/Loading';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch('/user/me');
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loading size="lg" fullScreen={true} />
      </div>
    );
  }

  if (isAdmin === false) {
    return notFound();
  }

  return <>{children}</>;
}
