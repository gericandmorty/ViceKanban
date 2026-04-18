'use client';

import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { API_URL } from '@/app/utils/api';

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

    if (formData.newPassword.length < 8 || formData.newPassword.length > 18) {
      toast.error('New password must be strictly between 8 and 18 characters');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast.error('Password must contain at least 1 uppercase and 1 special/number');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = API_URL;
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
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-xl">
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-foreground">Current Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            value={formData.oldPassword}
            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
            className="w-full bg-bg-subtle/50 border border-border-default rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-foreground/20 font-mono"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-foreground">New Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            maxLength={18}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full bg-bg-subtle/50 border border-border-default rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-foreground/20 font-mono"
            placeholder="Min. 8 characters"
          />
        </div>
        <p className="text-[11px] text-foreground/40 pl-1">Must be 8-18 chars, with 1 uppercase and 1 special/number.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-foreground">Confirm New Password</label>
        <div className="relative">
          <input 
            type="password" 
            required
            maxLength={18}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full bg-bg-subtle/50 border border-border-default rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-foreground/20 font-mono"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-6 h-10 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
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
      </div>
    </form>
  );
}
