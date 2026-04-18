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
            className="relative w-full max-w-2xl bg-background border border-border-default rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Color accent bar */}
            <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: color }} />
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-border-default bg-bg-subtle shrink-0">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {announcement.title}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-foreground/40 hover:text-foreground hover:bg-border-default rounded-md transition-all shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-[12px] text-foreground/40">
                <div className="flex items-center gap-1.5 border-r border-border-default pr-4">
                  <Calendar size={14} className="opacity-70" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-border-default flex items-center justify-center text-[10px] uppercase font-bold text-foreground shrink-0 overflow-hidden">
                    {announcement.creator.avatarUrl ? (
                      <img src={announcement.creator.avatarUrl} alt={announcement.creator.username} className="w-full h-full object-cover" />
                    ) : (
                      announcement.creator.username.charAt(0)
                    )}
                  </div>
                  <span className="font-medium text-foreground">{announcement.creator.username}</span>
                  <span className="opacity-60">posted this update</span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
              {announcement.imageUrl && (
                <div className="border-b border-border-default bg-bg-subtle flex items-center justify-center p-4">
                  <img
                    src={announcement.imageUrl}
                    alt="Attachment"
                    className="max-w-full max-h-[300px] object-contain rounded-md"
                  />
                </div>
              )}
              <div className="p-10">
                <div className="max-w-prose mx-auto">
                  <div className="text-[16px] text-foreground leading-[1.8] whitespace-pre-wrap font-sans selection:bg-accent/30">
                    {announcement.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-border-default bg-bg-subtle flex items-center justify-between shrink-0">
              <button
                onClick={onClose}
                className="btn btn-outline px-5 py-2 text-sm font-semibold transition-all"
              >
                Done
              </button>
              <div className="flex items-center gap-2 text-[11px] text-foreground/20">
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
