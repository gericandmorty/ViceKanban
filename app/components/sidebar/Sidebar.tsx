'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Layout, 
  Plus, 
  Users, 
  Settings, 
  Search,
  ChevronDown,
  LogOut,
  Loader2,
  Bell,
  X as CloseIcon,
  CheckCircle2
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/app/context/SidebarContext';
import { API_URL } from '@/app/utils/api';
import { useNotifications } from '@/app/hooks/useNotifications';
import NotificationPopover from './NotificationPopover';

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get('orgId');
  const { isSidebarOpen, closeSidebar } = useSidebar();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [invitationCount, setInvitationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const fetchUserData = useCallback(async () => {
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setAvatarUrl(data.avatarUrl);
        Cookies.set('user_name', data.username);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvitationCount = useCallback(async () => {
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvitationCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch invitation count:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
    fetchInvitationCount();
    fetchUserData();
    
    // Refresh counts periodically
    const interval = setInterval(() => {
      fetchInvitationCount();
      fetchUserData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrganizations, fetchInvitationCount, fetchUserData]);

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_name');
    router.push('/auth/login');
  };


  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen transition-all duration-300 z-[100]
        w-64 border-r border-border-default bg-bg-subtle flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <Link 
            href="/dashboard"
            onClick={closeSidebar}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Image src="/icon_vice.png" alt="Logo" width={32} height={32} style={{ height: 'auto' }} className="rounded group-hover:opacity-80 transition-opacity" />
            <span className="font-semibold text-sm group-hover:text-accent transition-colors">ViceKanBan</span>
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={closeSidebar}
              className="lg:hidden p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <CloseIcon size={18} />
            </button>
            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-md transition-all relative ${
                  isNotifOpen ? 'bg-border-default text-accent shadow-inner' : 'hover:bg-border-default/80 text-zinc-500'
                }`}
              >
                <Bell size={16} className={unreadCount > 0 ? 'animate-wiggle' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2f81f7] rounded-full border border-bg-subtle" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <NotificationPopover 
                    notifications={notifications}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onMarkAllAsRead={markAllAsRead}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Filter..." 
            className="w-full bg-background border border-border-default rounded-md py-1 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-sans"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Organizations</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-zinc-500 hover:text-accent transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {isLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              </div>
            ) : organizations.length === 0 ? (
              <p className="px-2 text-[11px] text-zinc-500 italic">No organizations found</p>
            ) : (
              organizations.map((org) => (
                  <Link 
                    key={org._id} 
                    href={`/dashboard?orgId=${org._id}`} 
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                    currentOrgId === org._id 
                      ? 'bg-border-default border border-border-default font-semibold' 
                      : 'hover:bg-border-default/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                    currentOrgId === org._id ? 'bg-accent text-white' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{org.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Invitations Link in Sidebar if pending */}
        {!currentOrgId && invitationCount > 0 && (
          <Link 
            href="/dashboard"
            onClick={closeSidebar}
            className="flex items-center justify-between px-2 py-2 bg-accent/5 border border-accent/10 rounded-lg cursor-pointer hover:bg-accent/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Bell size={14} className="text-accent" />
              <span className="text-xs font-bold text-accent">Pending Invites</span>
            </div>
            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {invitationCount}
            </span>
          </Link>
        )}

      </div>

      <div className="p-4 border-t border-border-default space-y-2 mt-auto">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-border-default transition-all group overflow-hidden"
        >
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <div className="w-6 h-6 rounded-full overflow-hidden relative border border-border-default">
                <Image src={avatarUrl} alt="Avatar" fill sizes="24px" className="object-cover" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-gradient-to-tr from-[#2f81f7] to-[#f78166] rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase">
                {username.charAt(0)}
              </div>
            )}
          </div>
          <span className="truncate group-hover:text-accent font-semibold transition-colors flex-1">{username}</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <CreateOrgModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOrganizations}
      />
    </aside>
    </>
  );
}
