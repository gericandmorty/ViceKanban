'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Upload, User, Trash2, Pencil, ChevronDown } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Image from 'next/image';
import CropImageModal from '../modals/CropImageModal';
import { API_URL } from '@/app/utils/api';
import { compressImage } from '@/app/utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentAvatar?: string;
  onSuccess: (newUrl: string) => void;
}

const DEFAULT_PROFILES = [
  { name: 'Navy Blue (Default)', path: '/default-profiles/navy-blue.jpg' },
  { name: 'Green', path: '/default-profiles/green.jpg' },
  { name: 'Red', path: '/default-profiles/red.jpg' },
  { name: 'Yellow', path: '/default-profiles/yellow.jpg' },
];

export default function AvatarUpload({ currentAvatar, onSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    
    e.target.value = '';
    setIsMenuOpen(false);
  };

  const handleSetDefaultAvatar = async (path: string) => {
    setIsUploading(true);
    setPreview(path);
    setIsMenuOpen(false);

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      
      const response = await fetch(`${apiUrl}/auth/profile/avatar/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatarUrl: path }),
      });

      if (!response.ok) throw new Error('Failed to update avatar');

      const data = await response.json();
      onSuccess(data.avatarUrl);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update avatar');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    handleSetDefaultAvatar('/default-profiles/navy-blue.jpg');
  };

  const onCropComplete = async (croppedFile: File) => {
    setSelectedImage(null);
    
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(croppedFile);

    setIsUploading(true);
    const formData = new FormData();
    const compressed = await compressImage(croppedFile);
    formData.append('file', compressed);

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      
      const response = await fetch(`${apiUrl}/auth/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      onSuccess(data.avatarUrl);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const isCustomAvatar = currentAvatar && !currentAvatar.includes('navy-blue.jpg');

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="relative group">
        {/* Avatar Container */}
        <div className="w-52 h-52 rounded-full overflow-hidden border border-border-default bg-bg-subtle flex items-center justify-center relative shadow-md transition-all duration-300">
          {preview || currentAvatar ? (
            <Image 
              src={preview || currentAvatar!} 
              alt="Avatar" 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-bg-subtle to-border-default flex items-center justify-center">
              <User size={64} className="text-foreground/10" />
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          )}
        </div>
        
        {/* Edit Button with Dropdown */}
        <div className="absolute bottom-1 left-4 z-20" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border-default hover:border-accent hover:text-accent text-foreground/80 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Pencil size={14} />
            Edit
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-48 bg-background border border-border-default rounded-lg shadow-xl z-30 py-1 overflow-hidden"
              >
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-2 text-xs text-foreground hover:bg-accent hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  Upload a photo...
                </button>
                
                {isCustomAvatar && (
                  <button 
                    onClick={handleRemoveAvatar}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors border-t border-border-default mt-1 pt-2"
                  >
                    <Trash2 size={14} />
                    Remove photo
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[12px] font-semibold text-foreground/80 uppercase tracking-widest">Default Profiles</p>
          <p className="text-[11px] text-foreground/40 italic">Quick select from our themes</p>
        </div>

        {/* Default Profiles Selection */}
        <div className="flex justify-center gap-4">
          {DEFAULT_PROFILES.map((profile) => (
            <button
              key={profile.path}
              onClick={() => handleSetDefaultAvatar(profile.path)}
              disabled={isUploading}
              className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 shadow-sm ${
                (preview || currentAvatar) === profile.path 
                  ? 'border-accent ring-4 ring-accent/10 sm:ring-offset-2 sm:ring-offset-background' 
                  : 'border-border-default hover:border-foreground/20'
              }`}
              title={profile.name}
            >
              <Image src={profile.path} alt={profile.name} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <CropImageModal 
          image={selectedImage} 
          onCancel={() => setSelectedImage(null)} 
          onCropComplete={onCropComplete} 
        />
      )}
    </div>
  );
}
