'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Layout,
  Search,
  Clock,
  Loader2,
  ChevronRight,
  Shield,
  Users,
  Check,
  X,
  Bell,
  Kanban,
  Menu
} from 'lucide-react';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import CreateProjectModal from '@/app/components/modals/CreateProjectModal';
import MembersTable from '@/app/components/organizations/MembersTable';
import OrganizationSettings from '@/app/components/organizations/OrganizationSettings';
import KanbanBoard from '@/app/components/kanban/KanbanBoard';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSidebar } from '@/app/context/SidebarContext';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSidebar, closeSidebar } = useSidebar();
  const orgIdFromUrl = searchParams.get('orgId');
  const projectIdFromUrl = searchParams.get('projectId');

  const [activeTab, setActiveTab] = useState('Board');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('User');
  const [detailedOrg, setDetailedOrg] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Auth/Permissions
  const [userId, setUserId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const fetchProjects = useCallback(async (orgId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${orgId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    fetchOrganizations();
    fetchInvitations();
    const storedUsername = Cookies.get('user_name');
    if (storedUsername) setUsername(storedUsername);
    
    // We don't have the userId in a cookie, we might need a /me endpoint
    // but for now we can infer permissions from the 'members' and 'owner' fields
    // which are populated in fetchOrgDetails.
  }, [fetchOrganizations, fetchInvitations]);

  useEffect(() => {
    let isCurrent = true;
    
    // Reset state immediately whenever orgId changes to prevent stale data "ghosting"
    setDetailedOrg(null);
    setProjects([]);
    setActiveTab('Board');

    const loadData = async () => {
      if (!orgIdFromUrl) return;
      
      setIsDetailLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = Cookies.get('access_token');
        
        // Fetch org details
        const orgRes = await fetch(`${apiUrl}/organizations/${orgIdFromUrl}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!orgRes.ok || !isCurrent) return;
        const orgData = await orgRes.json();
        setDetailedOrg(orgData);

        // Fetch projects for this org
        const projRes = await fetch(`${apiUrl}/organizations/${orgIdFromUrl}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (projRes.ok && isCurrent) {
          const projData = await projRes.json();
          setProjects(projData);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (isCurrent) setIsDetailLoading(false);
      }
    };

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [orgIdFromUrl]);

  const handleAcceptInvite = async (orgId: string, orgName: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${orgId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Joined ${orgName}!`);
        fetchOrganizations();
        fetchInvitations();
      } else {
        toast.error('Failed to join organization');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDeclineInvite = async (orgId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${orgId}/decline`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Invitation declined');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Failed to decline:', error);
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
    router.push('/dashboard');
  };

  const currentProject = projects.find(p => p._id === projectIdFromUrl);

  // Permission Checks
  const currentUserId = Cookies.get('user_id');
  const isOrgOwner = detailedOrg?.owner?._id === currentUserId || detailedOrg?.owner === currentUserId;
  const isProjectCreator = currentProject?.creator?._id === currentUserId || currentProject?.creator === currentUserId;
  const isOwnerOrCreator = isOrgOwner || isProjectCreator;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="border-b border-border-default bg-background sticky top-0 z-40">
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-[15px] md:text-lg min-w-0 flex-1 font-normal text-[#8b949e]">
              <Layout size={16} className="shrink-0" />
              <span 
                onClick={handleGoHome}
                className="hover:underline cursor-pointer transition-colors truncate"
              >
                {username}
              </span>
              <span className="shrink-0 mx-1">/</span>
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {detailedOrg ? (
                  <>
                    <span 
                      onClick={() => router.push(`/dashboard?orgId=${orgIdFromUrl}`)} 
                      className={`cursor-pointer hover:underline truncate ${!currentProject ? 'font-semibold text-[#f0f6fc]' : ''}`}
                      title={detailedOrg.name}
                    >
                      {detailedOrg.name} 
                    </span>
                    {currentProject && (
                      <>
                         <span className="shrink-0 mx-1">/</span>
                         <span className="font-semibold text-[#f0f6fc] truncate" title={currentProject.name}>{currentProject.name}</span>
                      </>
                    )}
                  </>
                ) : <span className="font-semibold text-[#f0f6fc]">Organizations</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
          </div>
        </div>

        {detailedOrg && (
          <div className="px-4 md:px-6 flex gap-4 md:gap-8 items-end overflow-x-auto no-scrollbar border-b border-border-default">
            {['Board', 'Members', 'Settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-all relative ${
                  activeTab === tab 
                    ? 'border-accent text-foreground' 
                    : 'border-transparent text-[#8b949e] hover:text-foreground hover:border-[#30363d]'
                }`}
              >
                {tab === 'Board' && <Kanban size={16} className="opacity-70" />}
                {tab === 'Members' && <Users size={16} className="opacity-70" />}
                {tab === 'Settings' && <Layout size={16} className="opacity-70" />}
                {tab}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area (Keyed by orgId to force clean unmounts) */}
      <div 
        key={orgIdFromUrl || 'overview'}
        className="flex-1 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0d1117]"
      >
        {isLoading || (orgIdFromUrl && isDetailLoading) ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : !detailedOrg ? (
          /* "Home" View with Organizations and Invitations */
          <div className="w-full max-w-4xl mx-auto py-8 px-6 space-y-8 overflow-y-auto h-full">

            {/* Pending Invitations Section */}
            <AnimatePresence>
              {invitations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-accent/30 bg-accent/5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/20">
                    <Bell className="text-accent" size={14} />
                    <span className="text-sm font-semibold text-accent">Pending invitations ({invitations.length})</span>
                  </div>
                  <div className="divide-y divide-border-default">
                    {invitations.map((inv) => (
                      <div key={inv._id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white font-bold text-sm">
                            {inv.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{inv.name}</p>
                            <p className="text-xs text-zinc-500">You've been invited to join this organization</p>
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
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Organizations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Your Organizations</h2>
                <button 
                  onClick={() => setIsOrgModalOpen(true)}
                  className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                >
                  <Plus size={12} /> New organization
                </button>
              </div>

              {organizations.length === 0 ? (
                <div className="rounded-lg border border-border-default border-dashed bg-background p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-bg-subtle border border-border-default flex items-center justify-center mx-auto text-zinc-500">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Create your first organization</h3>
                    <p className="text-xs text-zinc-500 mt-1">Organizations are shared spaces where teams can collaborate on projects.</p>
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
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group hover:bg-bg-subtle ${
                        orgIdFromUrl === org._id ? 'bg-bg-subtle' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold ${
                          orgIdFromUrl === org._id ? 'bg-accent text-white' : 'bg-bg-subtle text-accent border border-border-default'
                        }`}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold group-hover:text-accent transition-colors">{org.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Shield size={10} /> Member</span>
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Users size={10} /> {org.members?.length || 1} members</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Organization Workspace View */
          <div className="w-full h-full max-w-full mx-auto py-2 md:py-4 px-2 md:px-6 overflow-hidden flex flex-col">
            {activeTab === 'Members' ? (
              <MembersTable org={detailedOrg} onRefresh={() => fetchOrgDetails(orgIdFromUrl as string)} />
            ) : activeTab === 'Board' ? (
              projectIdFromUrl ? (
                /* Kanban View */
                <KanbanBoard 
                  projectId={projectIdFromUrl} 
                  isOwnerOrCreator={isOwnerOrCreator} 
                  members={detailedOrg.members}
                />
              ) : (
                /* Projects Selection List in Org */
                <div className="space-y-4 overflow-y-auto h-full pr-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Projects</h2>
                    {isOrgOwner && (
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
                    {isOrgOwner && (
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
              )
            ) : (
              <OrganizationSettings 
                org={detailedOrg} 
                isOwner={isOrgOwner} 
                onRefresh={() => fetchOrgDetails(orgIdFromUrl as string)} 
              />
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
    </div>
  );
}
