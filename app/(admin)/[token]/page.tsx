'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/app/utils/api';
import { 
  Users, 
  Building2, 
  Layout, 
  Megaphone, 
  Trash2, 
  Loader2, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import CreateAnnouncementModal from '@/app/components/modals/CreateAnnouncementModal';
import DeleteAnnouncementModal from '@/app/components/modals/DeleteAnnouncementModal';
import AnnouncementStackModal from '@/app/components/modals/AnnouncementStackModal';

interface Stats {
  userCount: number;
  orgCount: number;
  projectCount: number;
  globalAnnouncementCount: number;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
  creator: {
    username: string;
    avatarUrl: string;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStackOpen, setIsStackOpen] = useState(false);
  const [stackIndex, setStackIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [statsRes, annRes] = await Promise.all([
        apiFetch('/admin/stats'),
        apiFetch('/admin/announcements')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
    } catch (err) {
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/system/announcements/${announcementToDelete._id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Announcement deleted');
        setAnnouncements(prev => prev.filter(a => a._id !== announcementToDelete._id));
        if (stats) setStats({ ...stats, globalAnnouncementCount: stats.globalAnnouncementCount - 1 });
        setAnnouncementToDelete(null);
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setIsModalOpen(true);
  };

  const handleViewInStack = (index: number) => {
    setStackIndex(index);
    setIsStackOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-fg)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--background)] custom-scrollbar overflow-y-auto">
      {/* GitHub Style Header */}
      <div className="px-8 py-6 border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-2 text-sm text-[#8b949e]">
                <ShieldCheck size={16} />
                <span>Platform Administration</span>
              </nav>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mt-1">System Overview</h1>
          </div>

          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-[var(--success-fg)] hover:opacity-90 text-white rounded-md text-sm font-semibold transition-all border border-[rgba(240,246,252,0.1)] active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            Post Global Announcement
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-8 py-10 space-y-10">
        {/* Stats Grid - GitHub Insights Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-[var(--border-default)] rounded-md overflow-hidden bg-[var(--bg-subtle)]">
          <MetricItem 
            label="Total Users" 
            value={stats?.userCount || 0} 
            icon={<Users size={16} />}
          />
          <MetricItem 
            label="Organizations" 
            value={stats?.orgCount || 0} 
            icon={<Building2 size={16} />}
            hasBorder
          />
          <MetricItem 
            label="Live Projects" 
            value={stats?.projectCount || 0} 
            icon={<Layout size={16} />}
            hasBorder
          />
          <MetricItem 
            label="System Updates" 
            value={stats?.globalAnnouncementCount || 0} 
            icon={<Megaphone size={16} />}
            hasBorder
          />
        </div>

        {/* Global Announcements - GitHub Box Style */}
        <div className="border border-[var(--border-default)] rounded-md bg-[var(--bg-subtle)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border-default)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Megaphone size={16} className="text-[#8b949e]" />
              Active System Broadcasts
            </h2>
            <span className="text-xs text-[#8b949e] font-medium">
              {announcements.length} records found
            </span>
          </div>

          <div className="divide-y divide-[var(--border-default)]">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#8b949e]">
                <AlertCircle size={32} className="opacity-20 mb-3" />
                <p className="text-sm">No global announcements yet.</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div 
                  key={ann._id} 
                  className="flex items-start justify-between p-4 bg-[var(--background)] hover:bg-[var(--bg-subtle)] transition-colors group"
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                       <div className={`p-1.5 rounded-full border ${getTypeBorder(ann.type)}`}>
                         <div className={`w-2 h-2 rounded-full ${getTypeDot(ann.type)}`}></div>
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[var(--foreground)]">
                        <span 
                          onClick={() => handleViewInStack(announcements.indexOf(ann))}
                          className="font-semibold text-[var(--accent-fg)] hover:underline cursor-pointer"
                        >
                          {ann.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getTypeBadge(ann.type)}`}>
                          {ann.type}
                        </span>
                        {ann.imageUrl && (
                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-fg)] opacity-50" title="Has Attachment" />
                        )}
                      </div>
                      <div className="text-xs text-[#8b949e] flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-[var(--foreground)] opacity-70">#{ann._id.slice(-6)}</span>
                        <span>opened on {new Date(ann.createdAt).toLocaleDateString()}</span>
                        <span>by</span>
                        <div className="flex items-center gap-1.5">
                          <img src={ann.creator.avatarUrl || `https://ui-avatars.com/api/?name=${ann.creator.username}`} className="w-4 h-4 rounded-full border border-[var(--border-default)]" />
                          <span className="text-[var(--foreground)] opacity-90 hover:text-[var(--accent-fg)] transition-colors font-medium">{ann.creator.username}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(ann)}
                      className="p-2 text-[#8b949e] hover:text-[var(--accent-fg)] rounded-md hover:bg-[var(--accent-fg)]/10 transition-all"
                      title="Edit broadcast"
                    >
                      <Pencil size={15} />
                    </button>
                    <button 
                      onClick={() => setAnnouncementToDelete(ann)}
                      className="p-2 text-[#8b949e] hover:text-[#f85149] rounded-md hover:bg-[#f85149]/10 transition-all"
                      title="Delete broadcast"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateAnnouncementModal
        isGlobal={true}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSuccess={fetchData}
        editingAnnouncement={editingAnnouncement}
      />

      <DeleteAnnouncementModal
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleDeleteAnnouncement}
        title={announcementToDelete?.title || ''}
        isLoading={isDeleting}
      />

      <AnnouncementStackModal
        isOpen={isStackOpen}
        onClose={() => setIsStackOpen(false)}
        announcements={announcements as any}
        initialIndex={stackIndex}
      />
    </div>
  );
}

function MetricItem({ label, value, icon, hasBorder }: { label: string, value: number, icon: React.ReactNode, hasBorder?: boolean }) {
  return (
    <div className={`flex-1 p-5 flex flex-col gap-2 ${hasBorder ? 'border-l border-[var(--border-default)]' : ''}`}>
      <div className="flex items-center gap-2 text-[#8b949e]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-3xl font-semibold text-[var(--foreground)] tracking-tight">{value.toLocaleString()}</span>
    </div>
  );
}

function getTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case 'maintenance': return 'border-[#f85149]/30 text-[#f85149] bg-[#f85149]/10';
    case 'system': return 'border-[#58a6ff]/30 text-[#58a6ff] bg-[#58a6ff]/10';
    case 'feature': return 'border-[#d29922]/30 text-[#d29922] bg-[#d29922]/10';
    case 'update': return 'border-[#3fb950]/30 text-[#3fb950] bg-[#3fb950]/10';
    default: return 'border-[var(--border-default)] text-[#8b949e] bg-transparent';
  }
}

function getTypeBorder(type: string) {
  switch (type.toLowerCase()) {
    case 'maintenance': return 'border-[#f85149]/40';
    case 'system': return 'border-[#58a6ff]/40';
    case 'feature': return 'border-[#d29922]/40';
    case 'update': return 'border-[#3fb950]/40';
    default: return 'border-[var(--border-default)]';
  }
}

function getTypeDot(type: string) {
  switch (type.toLowerCase()) {
    case 'maintenance': return 'bg-[#f85149]';
    case 'system': return 'bg-[#58a6ff]';
    case 'feature': return 'bg-[#d29922]';
    case 'update': return 'bg-[#3fb950]';
    default: return 'bg-[#8b949e]';
  }
}
