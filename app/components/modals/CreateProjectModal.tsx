'use client';

import React, { useState } from 'react';
import { 
  X, 
  Layout, 
  Plus, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { API_URL } from '@/app/utils/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: string;
}

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  orgId 
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      
      const response = await fetch(`${apiUrl}/projects/org/${orgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        setName('');
        setDescription('');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create project');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-background border border-border-default rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-subtle shrink-0">
              <div className="flex items-center gap-2">
                <Layout size={18} className="text-accent" />
                <h2 className="font-bold">Create New Project</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-border-default rounded-md transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md flex items-center gap-2 text-red-800 dark:text-red-400 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Project Name</label>
                <div className="relative">
                  <Layout className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    autoFocus
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-zinc-400" size={16} />
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the project goals..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-border-default rounded-lg text-sm font-medium hover:bg-bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !name}
                  className="flex-1 btn btn-primary py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
