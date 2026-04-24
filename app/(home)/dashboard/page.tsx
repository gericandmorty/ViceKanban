'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  Layout,
  Search,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Shield,
  Users,
  Check,
  X,
  Activity,
  Megaphone,
  Bell,
  Menu,
  Kanban,
  User as UserIcon,
  Building2,
  GanttChartSquare
} from 'lucide-react';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import CreateProjectModal from '@/app/components/modals/CreateProjectModal';
import MembersTable from '@/app/components/organizations/MembersTable';
import OrganizationSettings from '@/app/components/organizations/OrganizationSettings';
import ProjectSettings from '@/app/components/organizations/ProjectSettings';
import Contributions from '@/app/components/organizations/Contributions';
import KanbanBoard from '@/app/components/kanban/KanbanBoard';
import Announcements from '@/app/components/organizations/Announcements';
import GanttChart from '@/app/components/organizations/GanttChart';
import AnnouncementDetailModal from '@/app/components/modals/AnnouncementDetailModal';
import AnnouncementStackModal from '@/app/components/modals/AnnouncementStackModal';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSidebar } from '@/app/context/SidebarContext';
import { apiFetch } from '@/app/utils/api';
import { useNotifications } from '@/app/hooks/useNotifications';
import NotificationPopover from '@/app/components/sidebar/NotificationPopover';
import Loading from '@/app/components/ui/Loading';
import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSidebar, closeSidebar, toggleCollapse } = useSidebar();
  const orgIdFromUrl = searchParams.get('orgId');
  const projectIdFromUrl = searchParams.get('projectId');

  const [activeTab, setActiveTab] = useState('Board');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('User');
  const [detailedOrg, setDetailedOrg] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Announcement popup state
  const [popupAnnouncements, setPopupAnnouncements] = useState<any[]>([]);
  const [allSystemAnnouncements, setAllSystemAnnouncements] = useState<any[]>([]);
  const [isSystemViewerOpen, setIsSystemViewerOpen] = useState(false);
  const [systemViewerIndex, setSystemViewerIndex] = useState(0);
  const hasCheckedInitialPopups = useRef(false);

  // Notification state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAll } = useNotifications();

  // Auth/Permissions
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await apiFetch('/user/me');
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        Cookies.set('user_name', data.username);
      }
    } catch (error) {
      console.error('Failed to fetch user data in dashboard:', error);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await apiFetch('/organizations/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await apiFetch('/organizations');
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

  const fetchProjects = useCallback(async (orgId: string) => {
    try {
      const response = await apiFetch(`/projects/org/${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  const fetchOrgDetails = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    try {
      const response = await apiFetch(`/organizations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedOrg(data);
        fetchProjects(id);
      }
    } catch (error) {
      console.error('Failed to fetch org details:', error);
    } finally {
      setIsDetailLoading(false);
    }
  }, [fetchProjects]);

  useEffect(() => {
    setIsMounted(true);
    fetchOrganizations();
    fetchInvitations();
    fetchUserProfile(); // Ensure name is loaded from API even if cookie is missing
    const storedUsername = Cookies.get('user_name');
    if (storedUsername) setUsername(storedUsername);

    const handleOrgChange = () => {
      fetchOrganizations();
      fetchInvitations();
    };
    window.addEventListener('orgMembershipChanged', handleOrgChange);
    return () => window.removeEventListener('orgMembershipChanged', handleOrgChange);
  }, [fetchOrganizations, fetchInvitations, fetchUserProfile]);

  // RESYNC STATE WITH URL PARAMS (Prevents "Sticky" stale data during navigation transitions)
  // This resets state DURING render when a mismatch is detected, rather than waiting for useEffect.
  const [prevOrgId, setPrevOrgId] = useState(orgIdFromUrl);
  const [prevProjectId, setPrevProjectId] = useState(projectIdFromUrl);

  if (orgIdFromUrl !== prevOrgId || projectIdFromUrl !== prevProjectId) {
    setPrevOrgId(orgIdFromUrl);
    setPrevProjectId(projectIdFromUrl);
    
    // Always clear project-specific data if moving between projects or exiting a project
    if (projectIdFromUrl !== prevProjectId) {
       setActiveTab('Board');
    }

    // Significant context change: Switching Organizations or going Home
    if (orgIdFromUrl !== prevOrgId) {
      setDetailedOrg(null);
      setProjects([]);
      setActiveTab('Board'); // Reset to Board when entering a new organization context
      
      if (orgIdFromUrl) {
        setIsDetailLoading(true); // Show loader immediately while fetching new data
      } else {
        setIsDetailLoading(false);
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    let isCurrent = true;

    const loadData = async () => {
      // If we're going home (no orgId), we've already handled the state reset above
      if (!orgIdFromUrl) {
        setIsDetailLoading(false);
        setIsLoading(false);
        return;
      }

      setIsDetailLoading(true);

      try {
        // 1. Fetch Organization Details
        // We always fetch if we don't have it, or if it's the wrong one
        if (!detailedOrg || detailedOrg._id !== orgIdFromUrl) {
          const orgRes = await apiFetch(`/organizations/${orgIdFromUrl}`);
          if (orgRes.ok && isCurrent) {
            const orgData = await orgRes.json();
            setDetailedOrg(orgData);
          } else if (!orgRes.ok) {
            handleGoHome();
            return;
          }
        }

        // 2. Fetch Projects for the org
        // We re-fetch if project list is empty OR if we're in a new organization context
        const projRes = await apiFetch(`/projects/org/${orgIdFromUrl}`);
        if (projRes.ok && isCurrent) {
          const projData = await projRes.json();
          setProjects(projData);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (isCurrent) {
          setIsDetailLoading(false);
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [orgIdFromUrl, projectIdFromUrl]);

  // Auto-popup the latest announcement when entering an org OR global updates
  const refreshPopups = useCallback(async (isManualRefresh = false) => {
    // CRITICAL: If a popup is already active, DO NOT modify the state. 
    // This prevents the 'sudden close' or 'shifting index' bug when background data refreshes.
    if ((popupAnnouncements.length > 0 || isSystemViewerOpen) && !isManualRefresh) return;

    try {
      // 1. Fetch System (Global) announcements
      const systemRes = await apiFetch('/system/announcements');
      let systemAnnouncements: any[] = [];
      if (systemRes.ok) {
        systemAnnouncements = await systemRes.json();
        setAllSystemAnnouncements(systemAnnouncements);
      }

      // 2. Fetch Organizational announcements if in an org
      let orgAnnouncements: any[] = [];
      if (orgIdFromUrl) {
        const orgRes = await apiFetch(`/organizations/${orgIdFromUrl}/announcements?page=1&limit=50`);
        if (orgRes.ok) {
          const data = await orgRes.json();
          orgAnnouncements = data.announcements || [];
        }
      }
      // Separate context: Global announcements on Home, Org announcements inside Orgs
      const allAnnouncements = orgIdFromUrl ? orgAnnouncements : systemAnnouncements;

      if (allAnnouncements.length > 0) {
        const seenAnnouncements = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
        
        // Filter out already seen ones
        const unread = allAnnouncements.filter((a: any) => !seenAnnouncements.includes(a._id));
        
        if (unread.length > 0) {
          // If any are unread, we show the full recent stack (up to 5)
          // This ensures they have context and can use the 'Next' button
          const recentStack = allAnnouncements.slice(0, 5);
          setPopupAnnouncements(recentStack);
        }
      }
      hasCheckedInitialPopups.current = true;
    } catch (err) {
      console.error('Failed to fetch popups:', err);
    }
  }, [orgIdFromUrl]);

  useEffect(() => {
    refreshPopups();

    const handleRefresh = () => refreshPopups(true);
    window.addEventListener('systemAnnouncementPosted', handleRefresh);
    return () => window.removeEventListener('systemAnnouncementPosted', handleRefresh);
  }, [refreshPopups]);

  const handleAcceptInvite = async (orgId: string, orgName: string) => {
    try {
      const response = await apiFetch(`/organizations/${orgId}/accept`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success(`Joined ${orgName}!`);
        fetchOrganizations();
        fetchInvitations();
        window.dispatchEvent(new Event('orgMembershipChanged'));
      } else {
        toast.error('Failed to join organization');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeclineInvite = async (orgId: string) => {
    try {
      const response = await apiFetch(`/organizations/${orgId}/decline`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Invitation declined');
        fetchInvitations();
        window.dispatchEvent(new Event('orgMembershipChanged'));
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    }
  };

  const handleSelectOrg = (id: string) => {
    // Explicitly navigate to the org root, ensuring any previous projectId is stripped
    router.push(`/dashboard?orgId=${id}`);
    setActiveTab('Board');
    closeSidebar(); // Ensure sidebar closes on mobile selection
  };

  const handleSelectProject = (projectId: string) => {
    router.push(`/dashboard?orgId=${orgIdFromUrl}&projectId=${projectId}`);
  };

  const handleGoHome = () => {
    // Universal Reset - Purge all local memory
    setDetailedOrg(null);
    setProjects([]);
    setIsDetailLoading(false);
    setIsLoading(false);
    setActiveTab('Board');
    router.push('/dashboard');
    setTimeout(() => refreshPopups(true), 100); // Re-fetch updates on clean landing
  };

  const handleOpenSystemViewer = (index: number) => {
    setSystemViewerIndex(index);
    setIsSystemViewerOpen(true);
  };

  const currentProject = projects.find(p => p._id === projectIdFromUrl);

  // Permission Checks
  const currentUserId = Cookies.get('user_id');
  const isOrgOwner = detailedOrg?.owner?._id === currentUserId || detailedOrg?.owner === currentUserId;
  const isCoOwner = detailedOrg?.members?.some((m: any) => (m.user?._id || m.user) === currentUserId && m.role === 'co-owner');
  const isAdmin = isOrgOwner || isCoOwner;
  const isProjectCreator = currentProject?.creator?._id === currentUserId || currentProject?.creator === currentUserId;
  const isOwnerOrCreator = isAdmin || isProjectCreator;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="bg-background sticky top-0 z-50 w-full">
        <div className="px-4 md:px-6 h-16 border-b border-border-default flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 hover:bg-border-default rounded-lg transition-colors text-foreground/60 hover:text-accent"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            <div className={`flex items-center gap-1.5 text-[14px] md:text-[15px] min-w-0 flex-1 font-normal transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
              <Link 
                href="/dashboard"
                onClick={(e) => {
                  if (!orgIdFromUrl) {
                    e.preventDefault();
                  } else {
                    e.preventDefault(); // Prevent double navigation
                    handleGoHome();
                  }
                }}
                className="flex items-center gap-1.5 group"
              >
                <UserIcon size={14} className="shrink-0 text-foreground/60 group-hover:text-accent transition-colors" />
                <span className="text-foreground/60 group-hover:text-foreground transition-colors max-w-[120px] truncate">
                  {username}
                </span>
              </Link>

              <span className="shrink-0 mx-2 text-foreground/30">/</span>

              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {orgIdFromUrl ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={(e) => {
                        e.preventDefault();
                        handleGoHome();
                      }}
                      className="hidden sm:inline text-foreground/60 hover:text-foreground transition-colors"
                    >
                      Organizations
                    </Link>
                    <span className="hidden sm:inline shrink-0 mx-2 text-foreground/30">/</span>
                    {detailedOrg && detailedOrg._id === orgIdFromUrl ? (
                      <>
                        <Link
                          href={`/dashboard?orgId=${orgIdFromUrl}`}
                          onClick={(e) => {
                            if (projectIdFromUrl || activeTab !== 'Board') {
                              e.preventDefault();
                              router.push(`/dashboard?orgId=${orgIdFromUrl}`);
                            }
                            setActiveTab('Board');
                            closeSidebar();
                          }}
                          className={`hover:underline truncate ${(!currentProject && activeTab === 'Board') ? 'font-semibold text-foreground' : 'text-foreground/60'}`}
                          title={detailedOrg.name}
                        >
                          {detailedOrg.name}
                        </Link>
                        {currentProject && (
                          <>
                            <span className="shrink-0 mx-2 text-foreground/30">/</span>
                            <Link
                              href={`/dashboard?orgId=${orgIdFromUrl}&projectId=${projectIdFromUrl}`}
                              onClick={(e) => {
                                if (activeTab !== 'Board') {
                                  e.preventDefault();
                                  router.push(`/dashboard?orgId=${orgIdFromUrl}&projectId=${projectIdFromUrl}`);
                                }
                                setActiveTab('Board');
                              }}
                              className={`hover:underline truncate ${activeTab === 'Board' ? 'font-semibold text-foreground' : 'text-foreground/60'}`}
                              title={currentProject.name}
                            >
                              {currentProject.name}
                            </Link>
                          </>
                        )}
                        {activeTab !== 'Board' && (
                          <>
                            <span className="shrink-0 mx-2 text-foreground/30">/</span>
                            <span className="font-semibold text-foreground truncate">{activeTab}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="h-4 w-24 bg-border-default animate-pulse rounded" />
                    )}
                  </>
                ) : (
                  <span className="font-semibold text-foreground">Organizations</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-md transition-all relative ${
                  isNotifOpen ? 'bg-border-default text-accent shadow-inner' : 'hover:bg-border-default/80 text-foreground/60'
                }`}
              >
                <Bell size={18} className={unreadCount > 0 ? 'animate-wiggle' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-bg-subtle" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <NotificationPopover 
                    notifications={notifications}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onDeleteAll={deleteAll}
                    onMarkAllAsRead={markAllAsRead}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Top Progress Loader (The "Lines" loader) - Positioned at the bottom of breadcrumb bar */}
          <AnimatePresence>
            {(isLoading || isDetailLoading) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute bottom-[-1px] left-0 h-[2px] bg-accent z-50 shadow-[0_0_8px_rgba(47,129,247,0.5)]"
              />
            )}
          </AnimatePresence>
        </div>

        {detailedOrg && (
          <div className="sticky top-16 z-30 bg-background/50 backdrop-blur-sm border-b border-border-default">
            <div className="px-4 md:px-6 flex items-end gap-1 min-h-[48px] overflow-x-auto no-scrollbar flex-nowrap mb-[-1px]">
              {['Board', 'Gantt Chart', 'Announcements', 'Members', 'Contributions', 'Settings'].map((tab: any, idx) => (
                <div key={tab} className="flex items-end group/tab-item h-[48px] flex-shrink-0">
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all relative border-t border-x rounded-t-md whitespace-nowrap ${activeTab === tab
                        ? 'bg-background border-border-default text-foreground z-20 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-background shadow-sm'
                        : 'border-transparent text-foreground/40 hover:text-foreground hover:bg-bg-subtle/30'
                      }`}
                  >
                    {tab === 'Board' && <Kanban size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    {tab === 'Gantt Chart' && <GanttChartSquare size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    {tab === 'Announcements' && <Megaphone size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    {tab === 'Members' && <Users size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    {tab === 'Contributions' && <Activity size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    {tab === 'Settings' && <Layout size={13} className={activeTab === tab ? 'text-foreground' : 'opacity-70'} />}
                    
                    <span className={activeTab === tab ? 'font-bold' : 'font-medium'}>{tab}</span>
                  </button>
                  {idx < 5 && activeTab !== tab && activeTab !== ['Board', 'Gantt Chart', 'Announcements', 'Members', 'Contributions', 'Settings'][idx+1] && (
                     <div className="h-4 w-[1px] bg-border-default/30 mx-0.5 group-hover/tab-item:opacity-0 transition-opacity" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 flex flex-col bg-background relative">

        {!detailedOrg && !isLoading && !isDetailLoading && !orgIdFromUrl ? (
          /* "Home" View with Organizations and Invitations */
          <div className="w-full py-8 px-6 space-y-10 overflow-y-auto h-full max-w-5xl mx-auto custom-scrollbar">
            
            {/* System Updates Section - Global Only */}
            {allSystemAnnouncements.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[12px] font-bold text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Activity size={14} className="text-accent/60" />
                    System Updates
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                   {allSystemAnnouncements.slice(0, 3).map((ann, idx) => (
                      <div 
                        key={ann._id}
                        onClick={() => handleOpenSystemViewer(idx)}
                        className="group relative bg-bg-subtle/30 hover:bg-bg-subtle/60 border border-border-default/40 hover:border-accent/20 px-5 py-3 rounded-lg transition-all cursor-pointer flex items-center justify-between overflow-hidden"
                      >
                         <div className="flex items-center gap-4 min-w-0 flex-1">
                            {/* Small Type Indicator */}
                            <div className={`w-1 h-4 rounded-full ${
                               ann.type === 'maintenance' ? 'bg-[#f85149]' : 
                               ann.type === 'system' ? 'bg-[#2f81f7]' : 
                               ann.type === 'feature' ? 'bg-[#f78166]' : 'bg-[#3fb950]'
                            }`} />

                            <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-3">
                                  <h3 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground truncate transition-colors font-sans">{ann.title}</h3>
                                  <span className="text-[9px] font-bold text-foreground/20 uppercase tabular-nums whitespace-nowrap">
                                     {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                               </div>
                               <p className="text-[11px] text-foreground/40 mt-0.5 line-clamp-1 group-hover:text-foreground/60 transition-colors uppercase tracking-tight font-medium opacity-80">{ann.content}</p>
                            </div>
                         </div>

                         <ChevronRight size={14} className="text-foreground/10 group-hover:text-accent/60 group-hover:translate-x-0.5 transition-all ml-4" />
                      </div>
                   ))}
                   {allSystemAnnouncements.length > 3 && (
                      <button 
                        onClick={() => handleOpenSystemViewer(0)}
                        className="text-[10px] font-bold text-foreground/30 hover:text-accent/60 transition-colors py-1 pl-12 flex items-center gap-1 group/more"
                      >
                         View changelog archives
                         <ChevronRight size={10} className="group-hover/more:translate-x-0.5 transition-transform" />
                      </button>
                   )}
                </div>
              </div>
            )}


            {/* Organizations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">Your Organizations</h2>
                {isMounted && (
                  <button
                    onClick={() => setIsOrgModalOpen(true)}
                    className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Plus size={12} /> New organization
                  </button>
                )}
              </div>

              {organizations.length === 0 ? (
                <div className="rounded-lg border border-border-default border-dashed bg-background p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-bg-subtle border border-border-default flex items-center justify-center mx-auto text-foreground/40">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Create your first organization</h3>
                    <p className="text-xs text-foreground/60 mt-1">Organizations are shared spaces where teams can collaborate on projects.</p>
                  </div>
                  <button
                    onClick={() => setIsOrgModalOpen(true)}
                    className="btn btn-primary py-1.5 px-5 text-sm mt-2"
                  >
                    Create an organization
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-border-default bg-background overflow-hidden divide-y divide-border-default">
                  {organizations.map((org) => (
                    <div
                      key={org._id}
                      onClick={() => handleSelectOrg(org._id)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group hover:bg-bg-subtle ${orgIdFromUrl === org._id ? 'bg-bg-subtle' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden ${
                          !org.avatarUrl ? (orgIdFromUrl === org._id ? 'bg-accent/10' : 'bg-bg-subtle') : ''
                        }`}>
                          {org.avatarUrl ? (
                            <Image src={org.avatarUrl} alt={org.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <Building2 className={orgIdFromUrl === org._id ? 'text-accent' : 'text-foreground/40'} size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{org.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-foreground/60 flex items-center gap-1"><Shield size={10} /> Member</span>
                            <span className="text-[11px] text-foreground/60 flex items-center gap-1"><Users size={10} /> {org.members?.length || 1} members</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-foreground/30 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations Section (Moved to bottom) */}
            <AnimatePresence>
              {invitations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-accent/20 bg-accent/5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/10">
                    <Bell className="text-accent" size={14} />
                    <span className="text-sm font-semibold text-accent">Pending invitations ({invitations.length})</span>
                  </div>
                  <div className="divide-y divide-border-default">
                    {invitations.map((inv) => {
                      const senderName = inv.invitation?.sender?.username;
                      const expiresAt = inv.invitation?.expiresAt ? new Date(inv.invitation.expiresAt) : null;
                      const hoursLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 3600000)) : null;
                      return (
                        <div key={inv._id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-md flex items-center justify-center relative overflow-hidden ${!inv.avatarUrl ? 'bg-accent/10' : ''}`}>
                              {inv.avatarUrl ? (
                                <Image src={inv.avatarUrl} alt={inv.name} fill sizes="36px" className="object-cover" />
                              ) : (
                                <Building2 className="text-accent" size={18} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{inv.name}</p>
                              <p className="text-xs text-foreground/60">
                                {senderName ? `${senderName} invited you to join` : 'You\'ve been invited to join this organization'}
                              </p>
                              {hoursLeft !== null && (
                                <p className="text-[10px] text-foreground/40 mt-0.5">
                                  Expires in {hoursLeft}h
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptInvite(inv._id, inv.name)}
                              className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1"
                            >
                              <Check size={12} /> Accept
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(inv._id)}
                              className="text-xs text-zinc-500 hover:text-red-500 transition-colors px-2"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Organization Workspace View */
          <div className="w-full flex-1 min-h-0 max-w-full mx-auto py-2 md:py-4 px-2 md:pr-4 md:pl-6 overflow-y-auto flex flex-col custom-scrollbar">
            {!detailedOrg || (detailedOrg._id !== orgIdFromUrl) ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loading size="lg" message="Loading organization workspace..." />
                </div>
              </div>
            ) : activeTab === 'Gantt Chart' ? (
              <GanttChart 
                orgId={orgIdFromUrl as string} 
                projectId={projectIdFromUrl}
                projectName={currentProject?.name ?? null}
                orgName={detailedOrg?.name ?? null}
              />
            ) : activeTab === 'Members' ? (
              <MembersTable org={detailedOrg} onRefresh={() => fetchOrgDetails(orgIdFromUrl as string)} />
            ) : activeTab === 'Announcements' ? (
              <Announcements orgId={orgIdFromUrl as string} isAdmin={isAdmin} isOwner={isOrgOwner} />
            ) : activeTab === 'Contributions' ? (
              <Contributions orgId={orgIdFromUrl as string} />
            ) : activeTab === 'Board' ? (
              <div className="flex-1 flex flex-col min-h-0">
                {projectIdFromUrl ? (
                  /* Kanban View with its own inner key for clean project switches */
                  <KanbanBoard
                    key={projectIdFromUrl}
                    projectId={projectIdFromUrl}
                    isOwnerOrCreator={isOwnerOrCreator}
                    orgOwnerId={detailedOrg.owner._id || detailedOrg.owner}
                    members={detailedOrg.members}
                  />
                ) : (
                  /* Projects Selection List in Org */
                  <div className="space-y-4 overflow-y-auto h-full pr-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Projects</h2>
                      {isMounted && isAdmin && (
                        <button
                          onClick={() => setIsProjectModalOpen(true)}
                          className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                        >
                          <Plus size={12} /> New project
                        </button>
                      )}
                    </div>

                    <div className="rounded-lg border border-border-default bg-background overflow-hidden divide-y divide-border-default">
                      {projects.map((project) => (
                        <div
                          key={project._id}
                          onClick={() => handleSelectProject(project._id)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group hover:bg-bg-subtle"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-bg-subtle border border-border-default flex items-center justify-center text-accent flex-shrink-0">
                              <Kanban size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold group-hover:text-accent transition-colors">{project.name}</p>
                              {project.description && (
                                <p className="text-[11px] text-zinc-500 truncate max-w-xs">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
                              <Clock size={10} /> Updated recently
                            </span>
                            <ChevronRight size={14} className="text-zinc-400 group-hover:text-accent transition-colors" />
                          </div>
                        </div>
                      ))}
                      {projects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <p className="text-sm text-[#8b949e]">All of the project will show here!</p>
                        </div>
                      )}
                      {isMounted && isAdmin && (
                        <div
                          onClick={() => setIsProjectModalOpen(true)}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group hover:bg-bg-subtle"
                        >
                          <div className="w-8 h-8 rounded-md border border-border-default border-dashed flex items-center justify-center text-zinc-500 group-hover:text-accent group-hover:border-accent transition-colors flex-shrink-0">
                            <Plus size={14} />
                          </div>
                          <p className="text-sm text-zinc-500 group-hover:text-accent transition-colors">Create a new project...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              currentProject ? (
                <ProjectSettings
                  project={currentProject}
                  orgId={orgIdFromUrl as string}
                  isAdmin={isAdmin}
                  isOrgOwner={isOrgOwner}
                  isCreator={isProjectCreator}
                  onRefresh={() => {
                    fetchProjects(orgIdFromUrl as string);
                  }}
                />
              ) : (
                <OrganizationSettings
                  org={detailedOrg}
                  isOwner={isOrgOwner}
                  isAdmin={isAdmin}
                  onRefresh={() => fetchOrgDetails(orgIdFromUrl as string)}
                />
              )
            )}
          </div>
        )}
      </div>

      <CreateOrgModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        onSuccess={fetchOrganizations}
      />

      {orgIdFromUrl && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          orgId={orgIdFromUrl}
          onClose={() => setIsProjectModalOpen(false)}
          onSuccess={() => fetchProjects(orgIdFromUrl)}
        />
      )}

      {/* Multi-announcement stack modal */}
      <AnnouncementStackModal
        isOpen={popupAnnouncements.length > 0}
        onClose={() => setPopupAnnouncements([])}
        announcements={popupAnnouncements}
      />

      {/* Manual Full System Viewer */}
      <AnnouncementStackModal
        isOpen={isSystemViewerOpen}
        onClose={() => setIsSystemViewerOpen(false)}
        announcements={allSystemAnnouncements}
        initialIndex={systemViewerIndex}
      />
    </div>
  );
}
