'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Info } from 'lucide-react';

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

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
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

export default function AnnouncementDetailModal({ isOpen, onClose, announcement }: AnnouncementDetailModalProps) {
  if (!announcement) return null;

  const color = getTypeColor(announcement.type);
  const dateStr = new Date(announcement.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Color accent bar */}
            <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: color }} />
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-[#30363d] bg-[#161b22] shrink-0">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[#f0f6fc] leading-tight">
                    {announcement.title}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] rounded-md transition-all shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-[12px] text-[#8b949e]">
                <div className="flex items-center gap-1.5 border-r border-[#30363d] pr-4">
                  <Calendar size={14} className="opacity-70" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#30363d] flex items-center justify-center text-[10px] uppercase font-bold text-[#f0f6fc] shrink-0 overflow-hidden">
                    {announcement.creator.avatarUrl ? (
                      <img src={announcement.creator.avatarUrl} alt={announcement.creator.username} className="w-full h-full object-cover" />
                    ) : (
                      announcement.creator.username.charAt(0)
                    )}
                  </div>
                  <span className="font-medium text-[#c9d1d9]">{announcement.creator.username}</span>
                  <span className="opacity-60">posted this update</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto bg-[#0d1117] custom-scrollbar">
              {announcement.imageUrl && (
                <div className="border-b border-[#30363d] bg-[#161b22] flex items-center justify-center p-4">
                  <img
                    src={announcement.imageUrl}
                    alt="Attachment"
                    className="max-w-full max-h-[300px] object-contain rounded-md"
                  />
                </div>
              )}
              <div className="p-10">
                <div className="max-w-prose mx-auto">
                  <div className="text-[16px] text-[#c9d1d9] leading-[1.8] whitespace-pre-wrap font-sans selection:bg-[#388bfd]/30">
                    {announcement.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] rounded-md transition-all border border-[#30363d]"
              >
                Done
              </button>
              <div className="flex items-center gap-2 text-[11px] text-[#484f58]">
                <Info size={12} className="opacity-50" />
                <span>Broadcasted to all organization members</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
