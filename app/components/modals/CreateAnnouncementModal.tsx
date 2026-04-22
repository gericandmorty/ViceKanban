'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/app/utils/api';
import { compressImage } from '@/app/utils/imageUtils';
import toast from 'react-hot-toast';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId?: string;
  isGlobal?: boolean;
  onSuccess: () => void;
  editingAnnouncement?: any; 
}

const ANNOUNCEMENT_TYPES = [
  { id: 'maintenance', color: '#f85149' },
  { id: 'system', color: '#2f81f7' },
  { id: 'feature', color: '#f78166' },
  { id: 'update', color: '#3fb950' },
];

export default function CreateAnnouncementModal({ 
  isOpen, 
  onClose, 
  orgId, 
  isGlobal = false, 
  onSuccess,
  editingAnnouncement 
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('update');
  const [isLoading, setIsLoading] = useState(false);
  
  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Sync state with editingAnnouncement
  React.useEffect(() => {
    if (isOpen) {
      if (editingAnnouncement) {
        setTitle(editingAnnouncement.title || '');
        setContent(editingAnnouncement.content || '');
        setType(editingAnnouncement.type || 'update');
        setExistingImageUrl(editingAnnouncement.imageUrl || null);
        setRemoveExistingImage(false);
      } else {
        // Reset for new announcement
        setTitle('');
        setContent('');
        setType('update');
        setExistingImageUrl(null);
        setRemoveExistingImage(false);
      }
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, editingAnnouncement]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an image file (PNG, JPG, WEBP, or GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false); // Picking a new one overrides "remove"
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleRemoveExisting = () => {
    setRemoveExistingImage(true);
    setExistingImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    if (!isGlobal && !orgId) {
        toast.error('Organization ID is missing');
        return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('type', type);
      
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        formData.append('image', compressed);
      } else if (removeExistingImage) {
        formData.append('removeImage', 'true');
      }

      let apiPath = isGlobal 
        ? '/system/announcements' 
        : `/organizations/${orgId}/announcements`;
      
      if (editingAnnouncement) {
        apiPath += `/${editingAnnouncement._id}`;
      }

      const response = await apiFetch(apiPath, {
        method: editingAnnouncement ? 'PATCH' : 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(
          editingAnnouncement 
            ? 'Announcement updated!' 
            : (isGlobal ? 'System announcement posted!' : 'Announcement posted and members notified!')
        );
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to process request');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const isEdit = !!editingAnnouncement;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-xl bg-background border border-border-default rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-default bg-bg-subtle flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {isEdit 
                      ? (isGlobal ? 'Edit Global Announcement' : 'Edit Announcement')
                      : (isGlobal ? 'Post Global Announcement' : 'Create Announcement')
                    }
                  </h2>
                  {isGlobal && !isEdit && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-wider">
                      System Admin
                    </span>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-border-default rounded-md transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                      Title
                    </label>
                    <input
                      autoFocus
                      required
                      type="text"
                      placeholder={isGlobal ? "e.g. New Theme: Dark Mode is here!" : "What's the update about?"}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border-default rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-foreground/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
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
                            borderColor: type === t.id ? 'var(--text-foreground)' : 'transparent',
                          }}
                          title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                      Content
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={isGlobal ? "Enter the details that all platform users will see..." : "Share the details with your team..."}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border-default rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-foreground/40 resize-none"
                    />
                  </div>

                  {/* Image Attachment */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                      Image
                    </label>
                    
                    {/* 1. Show existing image (if editing and haven't removed it yet) */}
                    {isEdit && existingImageUrl && !imagePreview && (
                      <div className="relative group rounded-md overflow-hidden border border-border-default bg-bg-subtle">
                        <img src={existingImageUrl} alt="Current" className="w-full max-h-[180px] object-contain opacity-80" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="cursor-pointer bg-background/90 hover:bg-background px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 border border-border-default">
                             <ImagePlus size={14} /> Replace
                             <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveExisting}
                            className="bg-red-500/90 hover:bg-red-500 px-3 py-1.5 rounded-md text-xs font-semibold text-white flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className="px-3 py-1.5 bg-background border-t border-border-default text-[10px] text-foreground/40 uppercase tracking-tight">
                           Current Attachment
                        </div>
                      </div>
                    )}

                    {/* 2. Show new image preview (if picked) */}
                    {imagePreview && (
                      <div className="relative group rounded-md overflow-hidden border border-border-default bg-bg-subtle">
                        <img src={imagePreview} alt="Preview" className="w-full max-h-[240px] object-contain" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-red-500/20 text-foreground/60 hover:text-red-500 rounded-md transition-all border border-border-default"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="px-3 py-1.5 bg-background border-t border-accent/20 text-[11px] text-accent font-medium truncate">
                           New file: {imageFile?.name}
                        </div>
                      </div>
                    )}

                    {/* 3. Empty state (if no image exists or it was removed) */}
                    {(!existingImageUrl && !imagePreview) && (
                      <label className="flex items-center justify-center gap-2 py-6 border border-dashed border-border-default rounded-md cursor-pointer hover:border-foreground/40 hover:bg-bg-subtle transition-all text-foreground/40 hover:text-foreground/60">
                        <ImagePlus size={18} />
                        <span className="text-xs font-medium">Attach an image (max 10 MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t border-border-default bg-bg-subtle flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-outline border-border-default px-4 py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !title || !content}
                    className="btn btn-primary px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        {isEdit ? 'Saving...' : 'Posting...'}
                      </>
                    ) : (
                      isEdit ? 'Save Changes' : 'Post Announcement'
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
