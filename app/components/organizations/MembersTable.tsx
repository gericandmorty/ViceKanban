'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  User as UserIcon, 
  Shield, 
  UserCheck, 
  Clock, 
  Plus,
  Loader2,
  CheckCircle2,
  Search,
  MoreVertical,
  X,
  UserMinus,
  Trash2
} from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';
import Image from 'next/image';
import { API_URL } from '@/app/utils/api';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface Member {
  user: User;
  role: string;
}

interface Organization {
  _id: string;
  name: string;
  members: Member[];
  invitedEmails: string[];
}

interface MembersTableProps {
  org: Organization;
  onRefresh: () => void;
}

export default function MembersTable({ org, onRefresh }: MembersTableProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removalTarget, setRemovalTarget] = useState<{ id: string, username: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');

      const response = await fetch(`${apiUrl}/organizations/${org._id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (response.ok) {
        setInviteSuccess(true);
        setInviteEmail('');
        onRefresh();
        setTimeout(() => {
          setInviteSuccess(false);
          setShowInviteForm(false);
        }, 2000);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Invitation failed');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setIsUpdatingRole(userId);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');

      const response = await fetch(`${apiUrl}/organizations/${org._id}/members/${userId}/role`, {
        method: 'POST', // Changed to POST to match the controller update
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast.success(`Role updated successfully`);
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsUpdatingRole(null);
      setActiveMenuId(null);
    }
  };

  const handleCancelInvite = async (email: string) => {
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');

      const response = await fetch(`${apiUrl}/organizations/${org._id}/invitations/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Invitation to ${email} cancelled`);
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to cancel invitation');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleRemoveMember = async () => {
    if (!removalTarget) return;

    const { id: userId, username } = removalTarget;

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');

      const response = await fetch(`${apiUrl}/organizations/${org._id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Removed ${username} from the organization`);
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setRemovalTarget(null);
    }
  };

  const currentUserId = Cookies.get('user_id');
  const userRole = org.members.find(m => m.user._id === currentUserId)?.role;
  const isOwner = userRole === 'owner';
  const isCoOwner = userRole === 'co-owner';
  const isAdmin = isOwner || isCoOwner;

  const filteredMembers = org.members.filter(m => 
    m.user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = org.invitedEmails.filter(email => 
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const allVisibleItems = [
    ...filteredMembers.map(m => ({ type: 'member' as const, data: m, id: m.user._id })),
    ...filteredInvites.map(e => ({ type: 'invite' as const, data: e, id: e }))
  ];

  const totalPages = Math.ceil(allVisibleItems.length / ITEMS_PER_PAGE);
  const paginatedItems = allVisibleItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-80 order-2 sm:order-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" size={14} />
          <input 
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-[5px] bg-[#0d1117] border border-[#30363d] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all placeholder:text-[#484f58]"
          />
        </div>
        
        <div className="order-1 sm:order-2 ml-auto">
          {!showInviteForm ? (
            <button 
              onClick={() => setShowInviteForm(true)}
              className="bg-[#238636] hover:bg-[#2ea043] text-[#ffffff] px-4 py-[5px] rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)]"
            >
              <Plus size={14} /> Invite member
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <form onSubmit={handleInvite} className="flex gap-2 flex-1">
                <input 
                  autoFocus
                  type="email" 
                  placeholder="Email address" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 sm:w-60 px-3 py-[5px] bg-[#0d1117] border border-[#30363d] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all"
                />
                <button 
                  type="submit" 
                  disabled={isInviting || !inviteEmail}
                  className="bg-[#238636] hover:bg-[#2ea043] text-[#ffffff] px-3 py-[5px] rounded-md text-xs font-semibold disabled:opacity-50"
                >
                  {isInviting ? <Loader2 className="animate-spin" size={14} /> : 'Send Invite'}
                </button>
              </form>
              <button 
                onClick={() => setShowInviteForm(false)}
                className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {inviteSuccess && (
        <div className="flex items-center gap-2 text-success text-xs bg-success/5 border border-success/20 p-2 rounded-md transition-all">
          <CheckCircle2 size={12} /> Invitation sent successfully!
        </div>
      )}

      {/* GitHub Themed Members Table */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-md shadow-sm">
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#161b22] rounded-t-md">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#f0f6fc]">
              {org.members.length + org.invitedEmails.length} members
            </span>
          </div>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#30363d] text-[12px] font-semibold text-[#8b949e] bg-[#0d1117]">
                <th className="px-4 py-3 w-3/4 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {/* Paginated Combined Content */}
              {paginatedItems.map((item, index) => (
                item.type === 'member' ? (
                  <tr key={item.id} className={`hover:bg-bg-subtle transition-colors group ${index === paginatedItems.length - 1 ? 'rounded-b-md' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold border border-border-default overflow-hidden relative">
                          {item.data.user.avatarUrl ? (
                            <Image
                              src={item.data.user.avatarUrl}
                              alt={item.data.user.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            item.data.user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[14px] text-[#f0f6fc] hover:text-[#58a6ff] hover:underline cursor-pointer transition-colors leading-tight">
                            {item.data.user.username}
                          </span>
                          <span className="text-[12px] text-[#8b949e]">
                            {item.data.user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-medium capitalize ${
                          item.data.role === 'owner' ? 'text-[#f78166] font-semibold' : 
                          item.data.role === 'co-owner' ? 'text-[#ffad33] font-semibold' : 
                          'text-[#8b949e]'
                        }`}>
                          {item.data.role === 'owner' ? 'Owner' : 
                          item.data.role === 'co-owner' ? 'Co-owner' : 
                          'Developer'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end items-center">
                        {isOwner && item.data.user._id !== currentUserId && (
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.data.user._id ? null : item.data.user._id);
                              }}
                              className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
                                activeMenuId === item.data.user._id 
                                  ? 'bg-[#30363d] text-[#f0f6fc]' 
                                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc] border border-transparent hover:border-[#30363d]'
                              }`}
                            >
                              {isUpdatingRole === item.data.user._id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <MoreVertical size={16} />
                              )}
                            </button>

                            {activeMenuId === item.data.user._id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className="absolute right-0 mt-2 w-44 bg-[#161b22] border border-[#30363d] rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                  <div className="py-1">
                                    <div className="px-3 py-1.5 border-b border-[#30363d] mb-1">
                                      <p className="text-[10px] uppercase font-bold text-[#8b949e] tracking-wider">Manage Member</p>
                                    </div>
                                    
                                    {item.data.role === 'developer' ? (
                                      <button 
                                        onClick={() => handleRoleUpdate(item.data.user._id, 'co-owner')}
                                        className="w-full text-left px-3 py-2 text-xs text-[#f0f6fc] hover:bg-[#1f6feb] flex items-center gap-2 transition-colors"
                                      >
                                        <Shield size={14} className="text-[#ffad33]" />
                                        Promote to Co-owner
                                      </button>
                                    ) : item.data.role === 'co-owner' ? (
                                      <button 
                                        onClick={() => handleRoleUpdate(item.data.user._id, 'developer')}
                                        className="w-full text-left px-3 py-2 text-xs text-[#f0f6fc] hover:bg-[#1f6feb] flex items-center gap-2 transition-colors"
                                      >
                                        <UserCheck size={14} className="text-[#8b949e]" />
                                        Demote to Developer
                                      </button>
                                    ) : null}

                                    <div className="border-t border-[#30363d] mt-1 pt-1">
                                      <button 
                                        onClick={() => {
                                          setRemovalTarget({ id: item.data.user._id, username: item.data.user.username });
                                          setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-[#f85149] hover:bg-[#f85149] hover:text-white flex items-center gap-2 transition-colors"
                                      >
                                        <UserMinus size={14} />
                                        Remove from Org
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="hover:bg-bg-subtle transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-zinc-600 font-bold border border-border-default border-dashed text-xs">
                          ?
                        </div>
                        <div className="flex flex-col opacity-70">
                          <span className="font-semibold text-[14px] text-[#f0f6fc] italic">
                            Invitation sent...
                          </span>
                          <span className="text-[12px] text-[#8b949e]">
                            {item.data}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#8b949e]">Developer</span>
                        <span className="text-[10px] uppercase font-bold text-[#8b949e] bg-[#21262d] border border-[#30363d] px-1.5 py-0.5 rounded leading-none">PENDING</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {isAdmin && (
                        <button 
                          onClick={() => handleCancelInvite(item.data as string)}
                          title="Cancel invitation"
                          className="p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          
          {paginatedItems.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No members match your search.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#30363d] flex items-center justify-between bg-[#161b22] rounded-b-md">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#30363d] rounded-md text-[12px] font-medium text-[#c9d1d9] hover:bg-[#30363d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#30363d] rounded-md text-[12px] font-medium text-[#c9d1d9] hover:bg-[#30363d] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Next
              </button>
            </div>
            <div className="text-[12px] text-[#8b949e]">
              Page <span className="text-[#f0f6fc] font-semibold">{currentPage}</span> of <span className="text-[#f0f6fc] font-semibold">{totalPages}</span>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={!!removalTarget}
        onClose={() => setRemovalTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${removalTarget?.username} from the organization? This will revoke their access to all associated projects.`}
        confirmText="Remove Member"
        type="danger"
      />
    </div>
  );
}
