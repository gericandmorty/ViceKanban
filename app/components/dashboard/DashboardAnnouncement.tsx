'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Bell } from 'lucide-react';

export default function DashboardAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('vice_kanban_announcement_dismissed');
    if (!isDismissed) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('vice_kanban_announcement_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-[#2f81f715] via-[#7d4cf615] to-[#f7816615] backdrop-blur-xl p-5 group"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#2f81f7] opacity-10 blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#f78166] opacity-10 blur-[80px]" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="text-[#f78166]" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
                  New Features Arrived!
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f78166]/20 text-[#f78166] border border-[#f78166]/30 uppercase tracking-tighter">New</span>
                </h3>
                <p className="text-xs text-[#8b949e] mt-1 leading-relaxed max-w-2xl">
                  We&apos;ve upgraded your workspace with new Kanban automation tools and real-time contribution tracking. 
                  Experience a faster, more fluid workflow with our latest dashboard updates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="text-xs font-medium text-[#f0f6fc] hover:text-white flex items-center gap-1 group/btn px-3 py-1.5 rounded-md hover:bg-white/5 transition-all">
                Learn more
                <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
              <button 
                onClick={handleDismiss}
                className="bg-white/5 hover:bg-white/10 text-[#8b949e] hover:text-[#f0f6fc] p-1.5 rounded-md transition-colors border border-white/10"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Subtle edge highlight */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
