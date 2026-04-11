'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, ChevronRight, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import AvatarUpload from '@/app/components/profile/AvatarUpload';
import ChangePasswordForm from '@/app/components/profile/ChangePasswordForm';
import { API_URL } from '@/app/utils/api';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const apiUrl = API_URL;
        const token = Cookies.get('access_token');
        const response = await fetch(`${apiUrl}/user/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <span>Settings</span>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">Profile</span>
        </div>
        
        <header className="space-y-1 border-b border-border-default pb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Public Profile</h1>
          <p className="text-zinc-500">Manage your identity and security settings.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Left Column: Avatar */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <User size={16} />
              Identity
            </h2>
            <AvatarUpload 
              currentAvatar={userData?.avatarUrl} 
              onSuccess={(url) => setUserData({ ...userData, avatarUrl: url })}
            />
          </div>

          {/* Right Column: Forms */}
          <div className="md:col-span-2 space-y-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-b border-border-default pb-2">
                  <Shield size={16} />
                  Security & Password
                </h2>
                <p className="text-sm text-zinc-500">
                  Update your password to keep your account secure.
                </p>
                <ChangePasswordForm />
              </div>

              <div className="space-y-4 pt-8 border-t border-border-default">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  Account Details
                </h2>
                <div className="bg-bg-subtle border border-border-default rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Username</span>
                    <span className="font-bold">{userData?.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Email Address</span>
                    <span className="font-bold">{userData?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
