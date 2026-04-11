'use client';

import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            value={formData.oldPassword}
            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
            className="w-full bg-background border border-border-default rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-sans"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full bg-background border border-border-default rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-sans"
            placeholder="Min. 6 characters"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confirm New Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full bg-background border border-border-default rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-sans"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <Lock size={16} />
            <span>Update Password</span>
          </>
        )}
      </button>
    </form>
  );
}
