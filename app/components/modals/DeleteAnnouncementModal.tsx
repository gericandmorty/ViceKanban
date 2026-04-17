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
            className="relative w-full max-w-md bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#f85149]">
                <AlertTriangle size={18} />
                <h2 className="text-base font-semibold">Delete Announcement</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] rounded-md transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-[#c9d1d9] leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#f0f6fc] underline underline-offset-4 decoration-[#30363d]">"{title}"</span>? 
                This action is permanent and will remove the announcement for all organization members.
              </p>
              
              <div className="mt-4 p-3 bg-[#f85149]/5 border border-[#f85149]/20 rounded-md">
                <p className="text-[11px] text-[#f85149] font-medium uppercase tracking-wider">
                  Danger Zone
                </p>
                <p className="text-[11px] text-[#8b949e] mt-1">
                  Once deleted, members will no longer be able to see the full content of this update.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#30363d] bg-[#161b22] flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition-all border border-[#30363d]"
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
