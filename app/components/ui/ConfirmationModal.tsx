'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Trash2, ShieldAlert } from 'lucide-react';

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
            className="relative w-full max-w-sm bg-background border border-border-default rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                type === 'warning' ? 'bg-orange-500/10 text-orange-500' : 'bg-accent/10 text-accent'
              }`}>
                {type === 'danger' ? <Trash2 size={24} /> : 
                 type === 'warning' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-zinc-500">
                  {message}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                    type === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' : 
                    'bg-accent text-white hover:opacity-90'
                  }`}
                >
                  {confirmText}
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
