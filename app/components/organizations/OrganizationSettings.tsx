'use client';

import React, { useState } from 'react';
import { Settings, Save, Loader2, Layout, Type, FileText, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '../ui/ConfirmationModal';
import DangerZoneModal from '../ui/DangerZoneModal';
import { API_URL } from '@/app/utils/api';
import Image from 'next/image';

interface OrganizationSettingsProps {
  org: any;
  isOwner: boolean;
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function OrganizationSettings({ org, isOwner, isAdmin, onRefresh }: OrganizationSettingsProps) {
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(org.avatarUrl || '');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUpdatingDetails) return;

    setIsUpdatingDetails(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${org._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        toast.success('Organization details updated');
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update details');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleUpdateLogo = async () => {
    if (!logoFile || isUpdatingLogo) return;

    setIsUpdatingLogo(true);
    const formData = new FormData();
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${org._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Organization logo updated');
        setLogoFile(null);
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update logo');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  const handleDeleteOrg = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${org._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success(`Organization ${org.name} deleted`);
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete organization');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-2 border-b border-[#30363d] pb-6">
        <h2 className="text-[32px] font-bold text-[#f0f6fc]">Organization Settings</h2>
        <p className="text-[14px] text-[#8b949e]">
          Manage your organization name, description, and general preferences.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-semibold text-[#f0f6fc] uppercase tracking-wide">General Details</h3>
        
        <form onSubmit={handleUpdateDetails} className="bg-[#0d1117] border border-[#30363d] rounded-md overflow-hidden">
          {/* Organization Name Row */}
          <div className="px-6 py-6 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-[#f0f6fc] w-full sm:w-1/3">
              Organization name
            </label>
            <div className="w-full sm:w-2/3">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin || isUpdatingDetails}
                className="w-full px-3 py-[5px] bg-[#0d1117] border border-[#30363d] rounded-md text-[14px] text-[#f0f6fc] focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Organization Description Row */}
          <div className="px-6 py-6 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-[#f0f6fc] w-full sm:w-1/3 mt-1">
              Description
            </label>
            <div className="w-full sm:w-2/3">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || isUpdatingDetails}
                placeholder="Add a description for your organization..."
                className="w-full px-3 py-[7px] bg-[#0d1117] border border-[#30363d] rounded-md text-[14px] text-[#f0f6fc] focus:outline-none focus:ring-1 focus:ring-[#1f6feb] transition-all min-h-[120px] resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-[#161b22]/30 flex justify-end gap-3 items-center">
            {isAdmin && (
              <>
                <button 
                  type="button"
                  onClick={() => { setName(org.name); setDescription(org.description || ''); }}
                  className="text-[14px] text-[#8b949e] hover:text-[#f0f6fc] transition-colors px-3 py-[5px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingDetails || !name.trim() || (name === org.name && description === (org.description || ''))}
                  className="bg-[#238636] hover:bg-[#2ea043] text-[#ffffff] px-4 py-[5px] rounded-md text-[14px] font-semibold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)] disabled:opacity-50"
                >
                  {isUpdatingDetails ? <Loader2 className="animate-spin" size={16} /> : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-[14px] font-semibold text-[#f0f6fc] uppercase tracking-wide">Organization Branding</h3>
        
        <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden relative flex items-center justify-center">
                {logoPreview ? (
                  <Image 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="text-[#8b949e] flex flex-col items-center">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <span className="text-[10px] mt-1 font-medium">NO LOGO</span>
                  </div>
                )}
              </div>
              
              {isAdmin && (
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                  <Upload size={24} className="text-white" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-[16px] font-semibold text-[#f0f6fc]">Organization Logo</h4>
              <p className="text-[14px] text-[#8b949e]">
                This logo will be displayed in the sidebar, dashboard, and invitations.
              </p>
              <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <label className="cursor-pointer bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] px-3 py-1.5 rounded-md text-[12px] font-semibold border border-[#30363d] transition-all">
                  Change logo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUpdatingLogo}
                  />
                </label>
                {logoPreview !== org.avatarUrl && (
                  <button 
                    onClick={() => { setLogoFile(null); setLogoPreview(org.avatarUrl || ''); }}
                    className="text-[12px] text-[#f85149] hover:underline px-2 py-1.5"
                    disabled={isUpdatingLogo}
                  >
                    Reset changes
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#8b949e] mt-2">
                Maximum file size: 5MB. Supported formats: PNG, JPG, WEBP.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-[#30363d] flex justify-end bg-[#161b22]/30 -mx-6 -mb-6 px-6 py-4">
            <button 
              onClick={handleUpdateLogo}
              disabled={isUpdatingLogo || !logoFile}
              className="bg-[#238636] hover:bg-[#2ea043] text-[#ffffff] px-4 py-[5px] rounded-md text-[14px] font-semibold flex items-center gap-2 transition-colors border border-[rgba(240,246,252,0.1)] disabled:opacity-50"
            >
              {isUpdatingLogo ? <Loader2 className="animate-spin" size={16} /> : 'Save Logo'}
            </button>
          </div>
        </div>
      </div>

      {!isOwner && (
        <LeaveOrgSection org={org} onRefresh={onRefresh} />
      )}

      {isOwner && (
        <div className="space-y-4 pt-10">
          <h3 className="text-[14px] font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h3>
          <div className="bg-[#000000]/20 border border-red-500/50 rounded-md overflow-hidden">
            <div className="p-4 border-b border-red-500/30 bg-red-500/5">
              <h4 className="text-[14px] font-semibold text-red-500">Critical Actions</h4>
            </div>
            <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-[#f0f6fc]">Delete this organization</h4>
                <p className="text-[14px] text-[#8b949e] max-w-md">Once you delete an organization, there is no going back. All projects, tasks, and data will be permanently wiped.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="bg-[#21262d] hover:bg-red-500 hover:text-white text-red-500 border border-[#30363d] px-5 py-2 rounded-md text-[14px] font-bold transition-all shadow-sm"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      <DangerZoneModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteOrg}
        title="Delete Organization"
        itemName={org.name}
        itemType="organization"
        isLoading={isDeleting}
      />
    </div>
  );
}

function LeaveOrgSection({ org, onRefresh }: { org: any, onRefresh: () => void }) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/organizations/${org._id}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`You have left ${org.name}`);
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to leave organization');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsLeaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-4 pt-10">
      <h3 className="text-[14px] font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h3>
      <div className="bg-[#000000]/20 border border-red-500/50 rounded-md overflow-hidden">
        <div className="p-4 border-b border-red-500/30 bg-red-500/5">
           <h4 className="text-[14px] font-semibold text-red-500">Voluntary Departure</h4>
        </div>
        <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-[16px] font-semibold text-[#f0f6fc]">Leave this organization</h4>
            <p className="text-[14px] text-[#8b949e] max-w-md">Once you leave, you will lose access to all projects and private data. Your work history will be preserved.</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowConfirm(true)}
            className="bg-[#21262d] hover:bg-red-500 hover:text-white text-red-500 border border-[#30363d] px-5 py-2 rounded-md text-[14px] font-bold transition-all shadow-sm"
          >
            Leave Organization
          </button>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLeave}
        title="Leave Organization"
        message={`Are you sure you want to leave ${org.name}? You will lose immediate access to your team's projects.`}
        confirmText="Yes, leave organization"
        type="danger"
      />
    </div>
  );
}
