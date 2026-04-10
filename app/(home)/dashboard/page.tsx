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
  Kanban
} from 'lucide-react';
import CreateOrgModal from '@/app/components/modals/CreateOrgModal';
import CreateProjectModal from '@/app/components/modals/CreateProjectModal';
import MembersTable from '@/app/components/organizations/MembersTable';
import KanbanBoard from '@/app/components/kanban/KanbanBoard';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (orgIdFromUrl) {
      fetchOrgDetails(orgIdFromUrl);
    } else {
      setDetailedOrg(null);
      setProjects([]);
    }
  }, [orgIdFromUrl, fetchOrgDetails]);

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
    router.push(`/dashboard?orgId=${id}`);
    setActiveTab('Board');
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
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-xl">
              <Layout size={20} className="text-zinc-400" />
              <span 
                onClick={handleGoHome}
                className="font-medium text-accent hover:underline cursor-pointer transition-colors"
              >
                {username}
              </span>
              <span className="text-zinc-400">/</span>
              <span className="font-bold flex items-center gap-2">
                {detailedOrg ? (
                  <>
                    <span onClick={() => router.push(`/dashboard?orgId=${orgIdFromUrl}`)} className="cursor-pointer hover:text-accent">
                      {detailedOrg.name} 
                    </span>
                    {currentProject && (
                      <>
                         <span className="text-zinc-400">/</span>
                         <span className="text-foreground">{currentProject.name}</span>
                      </>
                    )}
                  </>
                ) : 'Organizations'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!detailedOrg && (
              <button 
                onClick={() => setIsOrgModalOpen(true)}
                className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
              >
                <Plus size={14} /> New Organization
              </button>
            )}
            {detailedOrg && !currentProject && isOrgOwner && (
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="btn btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
              >
                <Plus size={14} /> New Project
              </button>
            )}
          </div>
        </div>

        {detailedOrg && (
          <div className="px-6 flex gap-8 items-end">
            {['Board', 'Members', 'Settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'border-orange-500 text-foreground' 
                    : 'border-transparent text-zinc-500 hover:text-foreground hover:border-zinc-300'
                }`}
              >
                {tab === 'Board' && <Kanban size={16} />}
                {tab === 'Members' && <Users size={16} />}
                {tab === 'Settings' && <Layout size={16} />}
                {tab}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area (Fixed height, children handle overflow) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0d1117]">
        {isLoading || (orgIdFromUrl && isDetailLoading) ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : !detailedOrg ? (
          /* "Home" View with Organizations and Invitations */
          <div className="w-full max-w-5xl mx-auto py-12 px-6 space-y-12 overflow-y-auto h-full">
            
            {/* Pending Invitations Section */}
            <AnimatePresence>
              {invitations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 px-1">
                    <Bell className="text-accent animate-bounce" size={18} />
                    <h3 className="text-lg font-bold">New Invitations ({invitations.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invitations.map((inv) => (
                      <div key={inv._id} className="bg-background border-2 border-accent/20 rounded-xl p-5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold">
                            {inv.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">You've been invited to join</p>
                            <h4 className="font-bold text-lg leading-tight">{inv.name}</h4>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAcceptInvite(inv._id, inv.name)}
                            className="btn btn-primary w-8 h-8 rounded-full flex items-center justify-center p-0"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeclineInvite(inv._id)}
                            className="btn btn-outline border-zinc-200 w-8 h-8 rounded-full flex items-center justify-center p-0"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Organizations List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Organizations</h2>
                <button 
                  onClick={() => setIsOrgModalOpen(true)}
                  className="btn btn-primary py-2 px-4 text-sm"
                >
                  Create new
                </button>
              </div>

              {organizations.length === 0 ? (
                <div className="bg-background border border-border-default rounded-xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-bg-subtle border border-border-default rounded-2xl flex items-center justify-center mx-auto shadow-sm text-zinc-400">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-xl font-semibold">Ready to collaborate?</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">
                    Create an organization to start managing projects and teams all in one place.
                  </p>
                  <button 
                    onClick={() => setIsOrgModalOpen(true)}
                    className="btn btn-primary py-2 px-8 mt-4"
                  >
                    Create Organization
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {organizations.map((org) => (
                    <motion.div
                      key={org._id}
                      whileHover={{ scale: 1.005, borderColor: 'var(--accent)' }}
                      onClick={() => handleSelectOrg(org._id)}
                      className="flex items-center justify-between p-5 bg-background border border-border-default rounded-xl cursor-pointer shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-bg-subtle border border-border-default flex items-center justify-center text-xl font-bold text-accent shadow-inner">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg group-hover:text-accent transition-colors">{org.name}</h4>
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1"><Shield size={12} /> Member</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {org.members?.length || 1} Members</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-zinc-300 group-hover:text-accent group-hover:translate-x-1 transition-all" size={24} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Organization Workspace View */
          <div className="w-full h-full max-w-full mx-auto py-4 px-6 overflow-hidden flex flex-col">
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
                <div className="space-y-8 overflow-y-auto h-full pr-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-extrabold mb-1">Projects in {detailedOrg.name}</h2>
                      <p className="text-zinc-500 text-lg">Select a project to view the Kanban board.</p>
                    </div>
                    <button 
                      onClick={() => setIsProjectModalOpen(true)}
                      className="btn btn-primary flex items-center gap-2 px-6 py-2"
                    >
                      <Plus size={18} /> New Project
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <motion.div
                        key={project._id}
                        whileHover={{ y: -4, borderColor: 'var(--accent)' }}
                        onClick={() => handleSelectProject(project._id)}
                        className="bg-background border border-border-default rounded-xl p-6 cursor-pointer shadow-sm group border-b-4 border-b-transparent hover:border-b-accent transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-lg bg-bg-subtle flex items-center justify-center text-accent">
                             <Layout size={20} />
                           </div>
                           <h3 className="font-bold text-lg group-hover:text-accent transition-colors">{project.name}</h3>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-2 h-10 mb-6">
                          {project.description || 'No description provided.'}
                        </p>
                        <div className="flex justify-between items-center text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><Clock size={12} /> Updated recently</span>
                          <span className="flex items-center gap-1 font-bold text-accent group-hover:translate-x-1 transition-transform">
                            Open Board <ChevronRight size={14} />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    <div 
                      onClick={() => setIsProjectModalOpen(true)}
                      className="bg-background border-2 border-border-default border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-bg-subtle flex items-center justify-center text-zinc-400 group-hover:text-accent group-hover:scale-110 transition-all">
                        <Plus size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold">Create a project</h3>
                        <p className="text-sm text-zinc-500">Launch a new workspace.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="p-12 text-center text-zinc-500 border border-border-default rounded-xl bg-background border-dashed">
                Settings View coming soon...
              </div>
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
