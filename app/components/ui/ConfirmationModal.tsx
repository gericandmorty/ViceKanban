'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-[#0d1117] border border-[#30363d] rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header - Styled like comment header */}
            <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#30363d] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#f0f6fc]">{title}</span>
              <button 
                onClick={onClose}
                className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-[14px] text-[#f0f6fc] leading-[1.5]">
                {message}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-1.5 text-[13px] font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2 text-[13px] font-bold rounded-md transition-all shadow-sm ${
                    type === 'danger' 
                      ? 'bg-[#238636] hover:bg-[#2ea043] text-white' 
                      : 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] hover:bg-[#30363d]'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
