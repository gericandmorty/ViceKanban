'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/app/utils/api';
import toast from 'react-hot-toast';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess: () => void;
}

const ANNOUNCEMENT_TYPES = [
  { id: 'update', color: '#3fb950' },
  { id: 'feature', color: '#f78166' },
  { id: 'system', color: '#2f81f7' },
  { id: 'maintenance', color: '#f85149' },
];

export default function CreateAnnouncementModal({ isOpen, onClose, orgId, onSuccess }: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('update');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('type', type);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await apiFetch(`/organizations/${orgId}/announcements`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Announcement posted and members notified!');
        setTitle('');
        setContent('');
        setType('update');
        removeImage();
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to post announcement');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-xl bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f0f6fc]">Create Announcement</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] rounded-md transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Title
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="What's the update about?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#f0f6fc] focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all placeholder:text-[#484f58]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Priority
                </label>
                <div className="flex items-center gap-3">
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`w-10 h-10 rounded-md border-2 transition-all ${
                        type === t.id
                          ? 'scale-110 shadow-lg'
                          : 'opacity-50 hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: t.color,
                        borderColor: type === t.id ? '#f0f6fc' : 'transparent',
                      }}
                      title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Content
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Share the details with your team..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#f0f6fc] focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all placeholder:text-[#484f58] resize-none"
                />
                <p className="text-[11px] text-[#484f58]">
                  Tip: This will be sent as a notification to all organization members.
                </p>
              </div>

              {/* Image Attachment */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                  Image (optional)
                </label>
                {imagePreview ? (
                  <div className="relative group rounded-md overflow-hidden border border-[#30363d] bg-[#161b22]">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-[200px] object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-[#0d1117]/80 hover:bg-[#f85149]/20 text-[#8b949e] hover:text-[#f85149] rounded-md transition-all border border-[#30363d]"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="px-3 py-1.5 bg-[#0d1117] border-t border-[#30363d] text-[11px] text-[#8b949e] truncate">
                      {imageFile?.name} ({((imageFile?.size || 0) / 1024 / 1024).toFixed(1)} MB)
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-6 border border-dashed border-[#30363d] rounded-md cursor-pointer hover:border-[#8b949e] hover:bg-[#161b22] transition-all text-[#8b949e] hover:text-[#c9d1d9]">
                    <ImagePlus size={18} />
                    <span className="text-xs font-medium">Attach an image (max 10 MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition-all border border-[#30363d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !title || !content}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white px-6 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[rgba(240,246,252,0.1)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Posting...
                    </>
                  ) : (
                    'Post Announcement'
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
