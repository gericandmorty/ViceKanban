'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface DangerZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: 'project' | 'organization';
  isLoading?: boolean;
}

export default function DangerZoneModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  isLoading = false
}: DangerZoneModalProps) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  
  // Reset state on close or open
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setConfirmText('');
      }, 300);
    }
  }, [isOpen]);

  const isMatched = confirmText === itemName;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-[#0d1117] border border-[#30363d] rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header - Styled like comment header */}
            <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#30363d] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#f0f6fc]">{title}</span>
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[14px] text-[#f0f6fc] leading-[1.5]">
                      You are about to delete <span className="font-bold">{itemName}</span>. This will permanently remove all associated tasks and data.
                    </p>
                    <p className="text-[13px] text-[#8b949e]">
                      This action cannot be undone. Are you sure you want to proceed?
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-1.5 text-[13px] font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setStep(2)}
                      className="px-5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-[13px] font-bold rounded-md transition-all shadow-sm"
                    >
                      I understand
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[14px] text-[#f0f6fc]">
                      To verify, type <span className="font-mono font-bold text-accent">{itemName}</span> below:
                    </p>
                    <input 
                      autoFocus
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type name here..."
                      className="w-full bg-[#010409] border border-[#30363d] rounded-md px-4 py-2.5 text-[14px] text-[#f0f6fc] outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="px-4 py-1.5 text-[13px] font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={onConfirm}
                      disabled={!isMatched || isLoading}
                      className="px-5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-[13px] font-bold rounded-md disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Deleting...
                        </>
                      ) : (
                        `Delete ${itemType}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
