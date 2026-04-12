'use client';

import React, { useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Image from 'next/image';
import CropImageModal from '../modals/CropImageModal';
import { API_URL } from '@/app/utils/api';

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
    formData.append('file', croppedFile);

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
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border-default bg-bg-subtle flex items-center justify-center relative">
          {preview || currentAvatar ? (
            <Image 
              src={preview || currentAvatar!} 
              alt="Avatar" 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-blue-500" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-white" size={32} />
            </div>
          )}
        </div>
        
        <label className="absolute bottom-1 right-1 bg-accent hover:bg-accent-hover text-white p-2 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110 active:scale-95">
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
      <p className="text-xs text-zinc-500 font-medium">Recommended: Square JPG, PNG or WebP</p>

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
