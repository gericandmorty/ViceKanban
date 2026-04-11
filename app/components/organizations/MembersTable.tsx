'use client';

import React, { useState } from 'react';
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
      }
    } catch (error) {
      console.error('Invitation failed:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removalTarget) return;

    const { id: userId, username } = removalTarget;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
    }
  };

  const currentUserId = Cookies.get('user_id');
  const isOwner = org.members.find(m => m.user._id === currentUserId)?.role === 'owner';

  const filteredMembers = org.members.filter(m => 
    m.user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvites = org.invitedEmails.filter(email => 
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border-default rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
        
        {!showInviteForm ? (
          <button 
            onClick={() => setShowInviteForm(true)}
            className="btn btn-primary px-3 py-1.5 text-xs flex items-center gap-2"
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
                className="flex-1 sm:w-60 px-3 py-1.5 bg-background border border-border-default rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
              <button 
                type="submit" 
                disabled={isInviting || !inviteEmail}
                className="btn btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {isInviting ? <Loader2 className="animate-spin" size={14} /> : 'Send Invite'}
              </button>
            </form>
            <button 
              onClick={() => setShowInviteForm(false)}
              className="p-1.5 text-zinc-500 hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {inviteSuccess && (
        <div className="flex items-center gap-2 text-success text-xs bg-success/5 border border-success/20 p-2 rounded-md transition-all">
          <CheckCircle2 size={12} /> Invitation sent successfully!
        </div>
      )}

      {/* GitHub Themed Members Table */}
      <div className="bg-background border border-border-default rounded-md overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border-default bg-background/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {org.members.length + org.invitedEmails.length} members
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-default text-[12px] font-semibold text-zinc-500 bg-background">
                <th className="px-4 py-3 w-3/4">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {/* Active Members */}
              {filteredMembers.map((member) => (
                <tr key={member.user._id} className="hover:bg-bg-subtle transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold border border-border-default overflow-hidden relative">
                        {member.user.avatarUrl ? (
                          <Image
                            src={member.user.avatarUrl}
                            alt={member.user.username}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          member.user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground hover:text-accent cursor-pointer transition-colors leading-none mb-1">
                          {member.user.username}
                        </span>
                        <span className="text-xs text-zinc-500 leading-none">
                          {member.user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-medium capitalize ${member.role === 'owner' ? 'text-orange-500' : 'text-zinc-400'}`}>
                        {member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {isOwner && member.user._id !== currentUserId && (
                      <button 
                        onClick={() => setRemovalTarget({ id: member.user._id, username: member.user.username })}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all flex items-center gap-2 ml-auto"
                        title="Remove from organization"
                      >
                        <UserMinus size={15} />
                        <span className="text-[10px] font-bold uppercase">Remove</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Pending Invites */}
              {filteredInvites.map((email) => (
                <tr key={email} className="hover:bg-bg-subtle transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-zinc-600 font-bold border border-border-default border-dashed text-xs">
                        ?
                      </div>
                      <div className="flex flex-col opacity-60">
                        <span className="font-semibold text-sm text-foreground italic">
                          Invitation sent...
                        </span>
                        <span className="text-xs text-zinc-500">
                          {email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-500">Developer</span>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 border border-border-default px-1.5 py-0.5 rounded leading-none">Pending</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                     <button className="p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all">
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && filteredInvites.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No members match your search.
            </div>
          )}
        </div>
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
