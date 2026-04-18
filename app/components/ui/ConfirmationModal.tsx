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
            className="relative w-full max-w-sm bg-background border border-border-default rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header - Styled like comment header */}
            <div className="bg-bg-subtle px-4 py-2.5 border-b border-border-default flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground">{title}</span>
              <button 
                onClick={onClose}
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-[14px] text-foreground leading-[1.5]">
                {message}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-1.5 text-[13px] font-semibold text-foreground/60 hover:text-foreground transition-colors"
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
                      ? 'btn btn-primary' 
                      : 'bg-bg-subtle text-foreground border border-border-default hover:bg-border-default'
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
