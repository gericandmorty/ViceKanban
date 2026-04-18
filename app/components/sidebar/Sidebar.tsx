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
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Building2
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/app/context/SidebarContext';
import { API_URL } from '@/app/utils/api';

export default function Sidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get('orgId');
  const { isSidebarOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [invitationCount, setInvitationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [isTasksCollapsed, setIsTasksCollapsed] = useState(false);

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
        const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setOrganizations(sortedData);
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

  const fetchAssignedTasks = useCallback(async () => {
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/tasks/assigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const sortedData = [...data].sort((a, b) => {
          const orgA = a.project?.organization?.name || '';
          const orgB = b.project?.organization?.name || '';
          return orgA.localeCompare(orgB);
        });
        setAssignedTasks(sortedData);
      }
    } catch (error) {
      console.error('Failed to fetch assigned tasks:', error);
    }
  }, []);

  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchAssignedTasks();
    };

    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
  }, [fetchAssignedTasks]);

  useEffect(() => {
    const handleMembershipChange = () => {
      fetchOrganizations();
    };
    window.addEventListener('orgMembershipChanged', handleMembershipChange);
    return () => window.removeEventListener('orgMembershipChanged', handleMembershipChange);
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchOrganizations();
    fetchInvitationCount();
    fetchUserData();
    fetchAssignedTasks();
    
    // Refresh counts periodically
    const interval = setInterval(() => {
      fetchInvitationCount();
      fetchUserData();
      fetchAssignedTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOrganizations, fetchInvitationCount, fetchUserData, fetchAssignedTasks]);

  const handleLogout = () => {
    // Clear all cookies and local storage dynamically
    Object.keys(Cookies.get()).forEach(cookieName => Cookies.remove(cookieName));
    localStorage.clear();
    
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
        ${isCollapsed ? 'w-20' : 'w-64'} border-r border-border-default bg-bg-subtle flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`h-16 border-b border-border-default flex items-center px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <Link 
                href="/dashboard"
                onClick={closeSidebar}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Image src="/icon_vice.png" alt="Logo" width={32} height={32} style={{ height: 'auto' }} className="rounded group-hover:opacity-80 transition-opacity flex-shrink-0" />
                <span className="font-semibold text-sm group-hover:text-accent transition-colors truncate">ViceKanBan</span>
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleCollapse}
              className={`hidden lg:flex p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-accent`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu size={18} />
            </button>
            <button 
              onClick={closeSidebar}
              className="lg:hidden p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>
      
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'} space-y-6 custom-scrollbar`}>
        <div className="space-y-4">
          <div className={`flex items-center px-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Organizations</span>}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-zinc-500 hover:text-accent transition-colors"
              title="Create Organization"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              </div>
            ) : organizations.length === 0 ? (
              !isCollapsed && <p className="px-2 text-[11px] text-zinc-500 italic">No organizations found</p>
            ) : (
              organizations.map((org) => (
                  <Link 
                    key={org._id} 
                    href={`/dashboard?orgId=${org._id}`} 
                    onClick={closeSidebar}
                    title={org.name}
                    className={`flex items-center rounded-md text-sm cursor-pointer transition-colors ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-2 py-1.5'} ${
                    currentOrgId === org._id 
                      ? 'bg-border-default border border-border-default font-semibold' 
                      : 'hover:bg-border-default/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 overflow-hidden relative ${
                    !org.avatarUrl ? (currentOrgId === org._id ? 'bg-accent/10' : 'bg-zinc-800/50') : ''
                  }`}>
                    {org.avatarUrl ? (
                      <Image src={org.avatarUrl} alt={org.name} fill sizes="24px" className="object-cover" />
                    ) : (
                      <Building2 size={14} className={currentOrgId === org._id ? 'text-accent' : 'text-zinc-500'} />
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">{org.name}</span>}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="space-y-4">
          <div 
            onClick={() => !isCollapsed && setIsTasksCollapsed(!isTasksCollapsed)}
            className={`flex items-center px-2 pt-2 border-t border-border-default/50 group/header ${isCollapsed ? 'justify-center' : 'justify-between cursor-pointer'}`}
            title="My Tasks"
          >
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <ChevronDown 
                  size={14} 
                  className={`text-zinc-500 transition-transform duration-200 ${isTasksCollapsed ? '-rotate-90' : ''}`} 
                />
              )}
              <CheckCircle2 size={isCollapsed ? 16 : 14} className="text-zinc-500" />
              {!isCollapsed && <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider group-hover/header:text-zinc-400">My Tasks</span>}
            </div>
            {!isCollapsed && assignedTasks.length > 0 && (
              <span className="bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {assignedTasks.length}
              </span>
            )}
          </div>
          
          <AnimatePresence initial={false}>
            {!isTasksCollapsed && !isCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center p-2">
                      <Loader2 size={16} className="animate-spin text-zinc-400" />
                    </div>
                  ) : assignedTasks.length === 0 ? (
                    <p className="px-2 text-[11px] text-zinc-500 italic">No pending tasks</p>
                  ) : (
                    Object.entries(
                      assignedTasks.reduce((acc: any, task) => {
                        const orgName = task.project?.organization?.name || 'Personal';
                        if (!acc[orgName]) acc[orgName] = [];
                        acc[orgName].push(task);
                        return acc;
                      }, {})
                    ).map(([orgName, tasks]: [string, any]) => (
                      <div key={orgName} className="space-y-1">
                        <div className="px-2 py-1 flex items-center gap-2">
                          <div className="w-1 h-3 bg-accent/30 rounded-full" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{orgName}</span>
                        </div>
                        <div className="space-y-0.5">
                          {tasks.map((task: any) => (
                            <Link 
                              key={task._id} 
                              href={`/dashboard?orgId=${task.project?.organization?._id}&projectId=${task.project?._id}`} 
                              onClick={closeSidebar}
                              className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm hover:bg-border-default/50 transition-all group"
                            >
                              <div className="flex-shrink-0 text-zinc-400 group-hover:text-accent transition-colors">
                                <CheckCircle2 size={14} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="truncate group-hover:text-accent transition-colors leading-tight font-medium">{task.title}</span>
                                <span className="text-[10px] text-zinc-500 truncate">{task.project?.name}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



      </div>

      <div className={`p-4 border-t border-border-default space-y-2 mt-auto overflow-hidden`}>
        <Link
          href="/profile"
          title={username}
          className={`flex items-center rounded-md text-sm cursor-pointer hover:bg-border-default transition-all group overflow-hidden ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'}`}
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
          {!isCollapsed && <span className="truncate group-hover:text-accent font-semibold transition-colors flex-1">{username}</span>}
        </Link>
        <button 
          onClick={handleLogout}
          title="Logout"
          className={`w-full flex items-center rounded-md text-sm cursor-pointer hover:bg-red-500/10 hover:text-red-500 transition-colors ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'}`}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Logout</span>}
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
