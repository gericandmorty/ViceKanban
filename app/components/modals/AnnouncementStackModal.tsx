'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Info, ChevronRight, ChevronLeft, Check } from 'lucide-react';

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

interface AnnouncementStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'maintenance': return '#f85149'; // Red
    case 'system': return '#2f81f7'; // Blue
    case 'feature': return '#f78166'; // Orange
    default: return '#3fb950'; // Green
  }
};

export default function AnnouncementStackModal({ isOpen, onClose, announcements }: AnnouncementStackModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mark current as seen when viewing
  useEffect(() => {
    if (isOpen && announcements[currentIndex]) {
      const id = announcements[currentIndex]._id;
      const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
      if (!seen.includes(id)) {
        localStorage.setItem('seen_announcements', JSON.stringify([...seen, id]));
      }
    }
  }, [isOpen, currentIndex, announcements]);

  // Reset index when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const color = getTypeColor(current.type);
  const dateStr = new Date(current.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        {/* Backdrop - No closing on click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* The Paged Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-[680px] bg-background border border-border-default rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Top color accent bar */}
          <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: color }} />

          {/* Header */}
          <div className="px-6 py-5 border-b border-border-default bg-bg-subtle flex flex-col gap-1 shrink-0">
            <h2 className="text-[20px] font-bold text-foreground leading-tight mb-1">
              {current.title}
            </h2>
            
            <div className="flex items-center gap-2 text-[11px] text-foreground/60">
              <Clock size={12} />
              <span>{dateStr}</span>
              <div className="w-1 h-1 rounded-full bg-border-default" />
              <span>{current.creator.username}</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
            {current.imageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border-default bg-bg-subtle flex items-center justify-center p-2">
                <img src={current.imageUrl} alt="" className="max-w-full max-h-[240px] object-contain" />
              </div>
            )}
            
            <div className="text-[15px] text-foreground/80 leading-[1.7] whitespace-pre-wrap font-sans">
              {current.content}
            </div>
          </div>

          {/* Paged Footer */}
          <div className="px-6 py-4 border-t border-border-default bg-bg-subtle flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.1em]">
                Organization Announcement
              </span>
              <span className="text-[13px] font-semibold text-foreground/60">
                {currentIndex + 1} of {announcements.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-5 py-2 rounded-md font-semibold text-sm transition-all shadow-sm ${
                    currentIndex === announcements.length - 1 
                    ? 'btn-primary' 
                    : 'btn-outline border-border-default'
                }`}
              >
                {currentIndex === announcements.length - 1 ? (
                  <>
                    <Check size={16} />
                    Done
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
