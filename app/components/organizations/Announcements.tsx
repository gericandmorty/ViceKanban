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
  Trash2
} from 'lucide-react';
import { apiFetch } from '@/app/utils/api';
import CreateAnnouncementModal from '../modals/CreateAnnouncementModal';
import AnnouncementDetailModal from '../modals/AnnouncementDetailModal';
import DeleteAnnouncementModal from '../modals/DeleteAnnouncementModal';
import toast from 'react-hot-toast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  imageUrl?: string;
  creator: {
    username: string;
    avatarUrl?: string;
  };
}

interface AnnouncementsProps {
  orgId: string;
  isAdmin: boolean;
}

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'maintenance':
      return '#f85149';
    case 'system':
      return '#2f81f7';
    case 'feature':
      return '#f78166';
    default:
      return '#3fb950';
  }
};

export default function Announcements({ orgId, isAdmin }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        <h2 className="text-[14px] font-semibold text-[#8b949e] uppercase tracking-wider">
          Latest Updates
        </h2>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#238636] hover:bg-[#2ea043] text-[#ffffff] px-4 py-[5px] rounded-md text-xs font-semibold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)]"
          >
            <Plus size={14} /> New Announcement
          </button>
        )}
      </div>

      <div className="bg-[#0d1117] border border-[#30363d] rounded-md shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#f0f6fc]">Organization Announcements</span>
          </div>
        </div>

        <div className="divide-y divide-[#30363d]">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-accent" size={24} />
              <p className="text-xs text-[#8b949e]">Loading announcements...</p>
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
                className="group flex items-center hover:bg-[#161b22] transition-colors border-b last:border-0 border-[#30363d]"
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
                        className="text-[14px] font-semibold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors cursor-pointer truncate"
                        title={announcement.title}
                      >
                        {announcement.title}
                      </h3>
                    
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#8b949e] whitespace-nowrap shrink-0">
                        <Calendar size={12} className="opacity-60" />
                        <span>{dateStr}</span>
                        <span className="opacity-40">at</span>
                        <span className="text-[#c9d1d9]">{timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className="text-[11px] font-semibold text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] px-3 py-1 rounded-md border border-[#30363d] flex items-center gap-1 transition-all"
                    >
                      Detail
                      <ChevronRight size={12} />
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => setAnnouncementToDelete(announcement)}
                        className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-all border border-transparent hover:border-[#f85149]/20"
                        title="Delete announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && announcements.length === 0 && (
          <div className="p-16 text-center space-y-3 bg-[#0d1117]">
            <div>
              <p className="text-[14px] font-semibold text-[#f0f6fc]">No announcements yet</p>
              <p className="text-[12px] text-[#8b949e]">New updates for the organization will appear here.</p>
            </div>
            {isAdmin && (
               <button 
               onClick={() => setIsModalOpen(true)}
               className="text-[12px] text-[#58a6ff] hover:underline"
             >
               Post the first one
             </button>
            )}
          </div>
        )}
      </div>
      
      {!isLoading && announcements.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#484f58]">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} announcements.
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-1.5 text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md border border-[#30363d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-semibold text-[#f0f6fc]">Page {currentPage}</span>
                <span className="text-[12px] text-[#8b949e]">of {totalPages}</span>
              </div>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-1.5 text-[#c9d1d9] bg-[#21262d] hover:bg-[#30363d] rounded-md border border-[#30363d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchAnnouncements(1);
        }}
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
    </div>
  );
}
