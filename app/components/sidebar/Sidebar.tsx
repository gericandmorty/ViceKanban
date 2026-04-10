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
  Bell
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import Image from 'next/image';

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get('orgId');

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [invitationCount, setInvitationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('User');

  const fetchOrganizations = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
    const storedUsername = Cookies.get('user_name');
    if (storedUsername) setUsername(storedUsername);
    
    // Refresh counts periodically
    const interval = setInterval(fetchInvitationCount, 30000);
    return () => clearInterval(interval);
  }, [fetchOrganizations, fetchInvitationCount]);

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_name');
    router.push('/auth/login');
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <aside className="w-64 border-r border-border-default bg-bg-subtle hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border-default flex items-center justify-between">
        <div 
          onClick={handleGoHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Image src="/icon_vice.png" alt="Logo" width={32} height={32} className="rounded group-hover:opacity-80 transition-opacity" />
          <span className="font-semibold text-sm group-hover:text-accent transition-colors">Project Management</span>
        </div>
        <div className="relative">
          <ChevronDown size={14} className="text-zinc-400" />
          {invitationCount > 0 && !currentOrgId && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
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
          <div 
            onClick={handleGoHome}
            className="flex items-center justify-between px-2 py-2 bg-accent/5 border border-accent/10 rounded-lg cursor-pointer hover:bg-accent/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Bell size={14} className="text-accent" />
              <span className="text-xs font-bold text-accent">Pending Invites</span>
            </div>
            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {invitationCount}
            </span>
          </div>
        )}

      </div>

      <div className="p-4 border-t border-border-default space-y-1">
        <div 
          onClick={handleGoHome}
          className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-border-default/50 font-medium transition-colors group"
        >
          <div className="w-5 h-5 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex-shrink-0" />
          <span className="truncate group-hover:text-accent font-bold">{username}</span>
        </div>
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </div>
      </div>

      <CreateOrgModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOrganizations}
      />
    </aside>
  );
}
