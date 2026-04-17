'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Layout, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Cookies from 'js-cookie';
import { API_URL } from '@/app/utils/api';
import Image from 'next/image';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrgModal({ isOpen, onClose, onSuccess }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setLogoFile(file);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');

      const formData = new FormData();
      formData.append('name', name);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await fetch(`${apiUrl}/organizations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create organization');
      }

      setName('');
      setLogoFile(null);
      setLogoPreview('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[400px] bg-background border border-border-default rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-subtle/30">
              <div className="flex items-center gap-2">
                <Layout size={18} className="text-accent" />
                <h2 className="text-base font-semibold text-foreground">Create new organization</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-border-default rounded-md transition-colors text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-foreground">Organization Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                  autoFocus
                  className="w-full bg-background border border-border-default rounded-md py-1.5 px-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent transition-all placeholder:text-zinc-500/50"
                />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  This will be the main workspace for your projects and team members.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[14px] font-medium text-foreground">Organization Logo <span className="text-zinc-500 font-normal">(Optional)</span></label>
                
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative w-14 h-14 rounded-md overflow-hidden group">
                      <Image 
                        src={logoPreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-14 h-14 rounded-md border border-dashed border-border-default flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-zinc-500 group">
                      <Upload size={16} className="group-hover:text-accent transition-colors" />
                      <span className="text-[9px] mt-0.5 font-medium group-hover:text-accent transition-colors">Upload</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                  
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-zinc-500 leading-snug">
                      Upload a logo for your organization. (Max 5MB)
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      PNG, JPG or WEBP recommended.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6">
                <button 
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline py-1 px-3 text-[13px] font-medium border-border-default"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="btn btn-primary py-1 px-3 text-[13px] font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Create Organization'
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
