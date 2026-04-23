'use client';

import React, { useState, useEffect } from 'react';
import AvatarUpload from '@/app/components/profile/AvatarUpload';
import ChangePasswordForm from '@/app/components/profile/ChangePasswordForm';
import ChangeUsernameForm from '@/app/components/profile/ChangeUsernameForm';
import { apiFetch } from '@/app/utils/api';
import { useTheme } from '@/app/context/ThemeContext';
import { Trash2, AlertCircle as AlertIcon, Sun, Moon, Loader2 } from 'lucide-react';
import Loading from '@/app/components/ui/Loading';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiFetch('/user/me');
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
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background selection:bg-accent/30 selection:text-white transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-4 py-8 md:px-8 md:py-12">
        {/* Page Header */}
        <header className="border-b border-border-default pb-6 mb-10">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Public profile</h1>
          <p className="text-sm text-foreground/60 mt-1">Manage your identity and security settings.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content Area */}
          <main className="lg:col-span-8 space-y-12">
            {/* Security Section */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground">Account security</h2>
                <p className="text-[13px] text-foreground/60 pb-4 border-b border-border-default">
                  Manage your password and security settings to keep your account safe.
                </p>
              </div>
              <div className="pt-2">
                <ChangePasswordForm />
              </div>
            </section>

            {/* Username Section */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground">Change username</h2>
                <p className="text-[13px] text-foreground/60 pb-4 border-b border-border-default">
                  Change how you appear across ViceKanBan.
                </p>
              </div>
              <div className="pt-2">
                <ChangeUsernameForm 
                  currentUsername={userData?.username} 
                  onSuccess={(newName) => setUserData({ ...userData, username: newName })} 
                />
              </div>
            </section>

            {/* Appearance Section */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground">Appearance settings</h2>
                <p className="text-[13px] text-foreground/60 pb-4 border-b border-border-default">
                  Select a theme to change your viewing experience within ViceKanBan.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-2">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group ${
                    theme === 'light' 
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                      : 'border-border-default hover:border-foreground/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-full h-20 rounded-lg bg-white border border-border-default shadow-sm flex items-center justify-center ${theme === 'light' ? 'opacity-100' : 'opacity-60'}`}>
                    <Sun size={24} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <span className={`text-[13px] font-semibold ${theme === 'light' ? 'text-foreground' : 'text-foreground/60'}`}>Light mode</span>
                </button>

                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all group ${
                    theme === 'dark' 
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                      : 'border-border-default hover:border-foreground/20 hover:bg-bg-subtle'
                  }`}
                >
                  <div className={`w-full h-20 rounded-lg bg-zinc-950 border border-zinc-800 shadow-sm flex items-center justify-center ${theme === 'dark' ? 'opacity-100' : 'opacity-60'}`}>
                    <Moon size={24} className="text-zinc-500 group-hover:text-accent transition-colors" />
                  </div>
                  <span className={`text-[13px] font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-foreground/60'}`}>Dark mode</span>
                </button>
              </div>
            </section>

            {/* Account Overview */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-foreground">Profile information</h2>
                <p className="text-[13px] text-foreground/60 pb-4 border-b border-border-default">
                  General account overview and identification details.
                </p>
              </div>
              <div className="bg-bg-subtle/50 border border-border-default rounded-lg divide-y divide-border-default/50 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-3.5 text-sm hover:bg-bg-subtle/80 transition-colors">
                  <span className="text-foreground/50">Username</span>
                  <span className="font-semibold text-foreground tracking-tight">{userData?.username}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3.5 text-sm hover:bg-bg-subtle/80 transition-colors">
                  <span className="text-foreground/50">Email Address</span>
                  <span className="font-semibold text-foreground/80 tracking-tight">{userData?.email}</span>
                </div>
              </div>
            </section>
          </main>

          {/* Avatar Sidebar Section */}
          <aside className="lg:col-span-4 lg:pl-4">
            <div className="sticky top-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Profile picture</h3>
                <div className="bg-bg-subtle/30 border border-border-default rounded-xl p-8 flex items-center justify-center shadow-inner">
                  <AvatarUpload 
                    currentAvatar={userData?.avatarUrl} 
                    onSuccess={(url) => setUserData({ ...userData, avatarUrl: url })}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/10 rounded-lg mt-4">
                  <AlertIcon size={14} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/60 leading-relaxed">
                    Your profile picture is visible to all organization members and collaborators.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
