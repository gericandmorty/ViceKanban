'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}

export default function DeleteAnnouncementModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  isLoading 
}: DeleteAnnouncementModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-background border border-border-default rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-default bg-bg-subtle flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                Delete Announcement
              </h3>
              <button 
                onClick={onClose}
                className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-border-default rounded-md transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-foreground underline underline-offset-4 decoration-border-default">"{title}"</span>? 
                This action is permanent and cannot be undone.
              </p>
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-red-500/80 mt-1">
                  This will remove the announcement for all organization members immediately.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-default bg-bg-subtle flex items-center justify-end gap-3">
              <button 
                onClick={onClose}
                className="btn btn-outline py-2 px-4 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-[#da3633] hover:bg-[#b6231f] text-white px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 border border-[rgba(240,246,252,0.1)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Deleting...
                  </>
                ) : (
                  'Delete Announcement'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
