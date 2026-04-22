'use client';

import React, { useState } from 'react';
import { Camera, Loader2, Upload, User } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Image from 'next/image';
import CropImageModal from '../modals/CropImageModal';
import { API_URL } from '@/app/utils/api';
import { compressImage } from '@/app/utils/imageUtils';

interface AvatarUploadProps {
  currentAvatar?: string;
  onSuccess: (newUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, onSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for the cropper
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = async (croppedFile: File) => {
    setSelectedImage(null);
    
    // Set local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(croppedFile);

    // Upload
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
      console.error(error);
      toast.error(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="relative group">
        {/* Avatar Container */}
        <div className="w-48 h-48 rounded-full overflow-hidden border border-border-default bg-bg-subtle flex items-center justify-center relative shadow-sm group-hover:border-accent/40 transition-all duration-300">
          {preview || currentAvatar ? (
            <Image 
              src={preview || currentAvatar!} 
              alt="Avatar" 
              fill 
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-bg-subtle to-border-default flex items-center justify-center">
              <User size={64} className="text-foreground/10" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer">
            <Upload className="text-white" size={32} />
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 backdrop-blur-[2px]">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          )}
        </div>
        
        {/* Secondary Upload Trigger (Icon) */}
        <label className="absolute bottom-3 right-3 bg-background border border-border-default hover:border-accent hover:text-accent text-foreground/60 p-2.5 rounded-full cursor-pointer shadow-md transition-all transform hover:scale-110 active:scale-95 z-20">
          <Camera size={18} />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[12px] font-semibold text-foreground/80">Profile Picture</p>
        <p className="text-[11px] text-foreground/40 max-w-[180px]">Square JPG, PNG or WebP recommended for best results.</p>
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
