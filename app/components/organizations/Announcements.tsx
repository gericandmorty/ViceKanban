'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Sparkles, 
  Zap, 
  Info, 
  AlertCircle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  Trash2,
  Pencil
} from 'lucide-react';
import { getObfuscatedCookie } from '@/app/utils/cookieUtils';
import { apiFetch } from '@/app/utils/api';
import CreateAnnouncementModal from '../modals/CreateAnnouncementModal';
import AnnouncementDetailModal from '../modals/AnnouncementDetailModal';
import AnnouncementStackModal from '../modals/AnnouncementStackModal';
import DeleteAnnouncementModal from '../modals/DeleteAnnouncementModal';
import toast from 'react-hot-toast';
import Loading from '@/app/components/ui/Loading';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
  creator: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface AnnouncementsProps {
  orgId: string;
  isAdmin: boolean;
  isOwner?: boolean;
}

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'priority':
      return '#f85149';
    case 'high':
      return '#2f81f7';
    case 'medium':
      return '#f78166';
    default:
      return '#3fb950'; // low
  }
};

export default function Announcements({ orgId, isAdmin, isOwner }: AnnouncementsProps) {
  const currentUserId = getObfuscatedCookie('user_id');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStackOpen, setIsStackOpen] = useState(false);
  const [stackIndex, setStackIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  const fetchAnnouncements = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/organizations/${orgId}/announcements?page=${page}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
        setTotalItems(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const handleDelete = async () => {
    if (!announcementToDelete) return;

    setIsDeleting(true);
    try {
      const response = await apiFetch(`/organizations/${orgId}/announcements/${announcementToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Announcement deleted');
        setAnnouncementToDelete(null);
        fetchAnnouncements(currentPage);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete announcement');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(currentPage);
  }, [fetchAnnouncements, currentPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-foreground/60 uppercase tracking-wider">
          Latest Updates
        </h2>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> New Announcement
          </button>
        )}
      </div>

      <div className="bg-background border border-border-default rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default bg-bg-subtle">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-foreground">Organization Announcements</span>
          </div>
        </div>

        <div className="divide-y divide-border-default">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loading size="md" message="Loading announcements..." />
            </div>
          ) : announcements.map((announcement) => {
            const color = getTypeColor(announcement.type);
            const date = new Date(announcement.createdAt);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            return (
              <div
                key={announcement._id}
                className="group flex items-center hover:bg-bg-subtle transition-colors border-b last:border-0 border-border-default"
              >
                {/* Color indicator line */}
                <div
                  className="w-[3px] self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                
                <div className="flex-1 flex items-center justify-between gap-4 px-4 py-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <h3 
                        onClick={() => setSelectedAnnouncement(announcement)}
                        className="text-[14px] font-semibold text-foreground group-hover:text-accent transition-colors cursor-pointer truncate"
                        title={announcement.title}
                      >
                        {announcement.title}
                      </h3>
                    
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-foreground/60 whitespace-nowrap shrink-0">
                        <Calendar size={12} className="opacity-60" />
                        <span>{dateStr}</span>
                        <span className="opacity-40">at</span>
                        <span className="text-foreground/80">{timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button 
                        onClick={() => setSelectedAnnouncement(announcement)}
                      className="text-[11px] font-semibold text-foreground/80 bg-border-default/50 hover:bg-border-default px-3 py-1 rounded-md border border-border-default flex items-center gap-1 transition-all"
                    >
                      Detail
                      <ChevronRight size={12} />
                    </button>
                    {isAdmin && (
                      <div className="flex items-center gap-1 min-w-[70px] justify-end">
                        {announcement.creator._id === currentUserId && (
                          <button 
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-foreground/60 hover:text-accent hover:bg-accent/10 rounded-md transition-all border border-transparent hover:border-accent/20"
                            title="Edit announcement"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {(announcement.creator._id === currentUserId || isOwner) && (
                          <button 
                            onClick={() => setAnnouncementToDelete(announcement)}
                            className="p-1.5 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all border border-transparent hover:border-red-500/20"
                            title={isOwner && announcement.creator._id !== currentUserId ? "Delete announcement (as Owner)" : "Delete announcement"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && announcements.length === 0 && (
          <div className="p-16 text-center space-y-3 bg-background">
            <div>
              <p className="text-[14px] font-semibold text-foreground">No announcements yet</p>
              <p className="text-[12px] text-foreground/60">New updates for the organization will appear here.</p>
            </div>
            {isAdmin && (
               <button 
               onClick={() => setIsModalOpen(true)}
               className="text-[12px] text-accent hover:underline"
             >
               Post the first one
             </button>
            )}
          </div>
        )}
      </div>
      
      {!isLoading && announcements.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-foreground/40">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} announcements.
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 text-foreground/80 bg-border-default/50 hover:bg-border-default rounded-md border border-border-default transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-semibold text-foreground">Page {currentPage}</span>
                <span className="text-[12px] text-foreground/60">of {totalPages}</span>
              </div>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 text-foreground/80 bg-border-default/50 hover:bg-border-default rounded-md border border-border-default transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <CreateAnnouncementModal
        orgId={orgId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
          fetchAnnouncements(1);
        }}
        editingAnnouncement={editingAnnouncement}
      />

      <AnnouncementDetailModal
        isOpen={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        announcement={selectedAnnouncement}
      />

      <DeleteAnnouncementModal
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleDelete}
        title={announcementToDelete?.title || ''}
        isLoading={isDeleting}
      />

      <AnnouncementStackModal
        isOpen={isStackOpen}
        onClose={() => setIsStackOpen(false)}
        announcements={announcements as any}
        initialIndex={stackIndex}
      />
      <div className="h-40" />
    </div>
  );
}
