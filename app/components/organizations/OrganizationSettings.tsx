'use client';

import React, { useState } from 'react';
import { Settings, Save, Loader2, Layout, Type, FileText, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '../ui/ConfirmationModal';
import DangerZoneModal from '../ui/DangerZoneModal';
import { API_URL, apiFetch } from '@/app/utils/api';
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
      const response = await apiFetch(`/organizations/${org._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await apiFetch(`/organizations/${org._id}`, {
        method: 'POST',
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
      const response = await apiFetch(`/organizations/${org._id}`, {
        method: 'DELETE'
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
      <div className="space-y-2 border-b border-border-default pb-6">
        <h2 className="text-[32px] font-bold text-foreground">Organization Settings</h2>
        <p className="text-[14px] text-foreground/60">
          Manage your organization name, description, and general preferences.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-semibold text-foreground uppercase tracking-wide">General Details</h3>
        
        <form onSubmit={handleUpdateDetails} className="bg-background border border-border-default rounded-md overflow-hidden">
          {/* Organization Name Row */}
          <div className="px-6 py-6 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-foreground w-full sm:w-1/3">
              Organization name
            </label>
            <div className="w-full sm:w-2/3">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin || isUpdatingDetails}
                className="w-full px-3 py-[5px] bg-background border border-border-default rounded-md text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Organization Description Row */}
          <div className="px-6 py-6 border-b border-border-default flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-foreground w-full sm:w-1/3 mt-1">
              Description
            </label>
            <div className="w-full sm:w-2/3 space-y-1">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || isUpdatingDetails}
                maxLength={255}
                placeholder="Add a description for your organization..."
                className="w-full px-3 py-[7px] bg-background border border-border-default rounded-md text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all min-h-[120px] resize-none disabled:opacity-50"
              />
              <div className={`text-[10px] text-right font-medium transition-colors ${description.length >= 240 ? 'text-red-500' : 'text-foreground/30'}`}>
                {description.length}/255 characters
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-bg-subtle flex justify-end gap-3 items-center">
            {isAdmin && (
              <>
                <button 
                  type="button"
                  onClick={() => { setName(org.name); setDescription(org.description || ''); }}
                  className="text-[14px] text-foreground/60 hover:text-foreground transition-colors px-3 py-[5px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingDetails || !name.trim() || (name === org.name && description === (org.description || ''))}
                  className="btn btn-primary px-4 py-[5px] text-[14px]"
                >
                  {isUpdatingDetails ? <Loader2 className="animate-spin" size={16} /> : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-[14px] font-semibold text-foreground uppercase tracking-wide">Organization Branding</h3>
        
        <div className="bg-background border border-border-default rounded-md p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden relative border border-border-default bg-bg-subtle flex items-center justify-center">
                {logoPreview ? (
                  <Image 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="text-foreground/40 flex flex-col items-center">
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
              <h4 className="text-[16px] font-semibold text-foreground">Organization Logo</h4>
              <p className="text-[14px] text-foreground/60">
                This logo will be displayed in the sidebar, dashboard, and invitations.
              </p>
              {isAdmin && (
                <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer btn btn-outline border-border-default py-1 px-3 text-[12px] font-semibold">
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
                      className="text-[12px] text-red-500 hover:underline px-2 py-1.5"
                      disabled={isUpdatingLogo}
                    >
                      Reset changes
                    </button>
                  )}
                </div>
              )}
              <p className="text-[11px] text-foreground/40 mt-2">
                Maximum file size: 5MB. Supported formats: PNG, JPG, WEBP.
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="mt-8 pt-4 border-t border-border-default flex justify-end bg-bg-subtle -mx-6 -mb-6 px-6 py-4">
              <button 
                onClick={handleUpdateLogo}
                disabled={isUpdatingLogo || !logoFile}
                className="btn btn-primary px-4 py-[5px] text-[14px]"
              >
                {isUpdatingLogo ? <Loader2 className="animate-spin" size={16} /> : 'Save Logo'}
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOwner && (
        <LeaveOrgSection org={org} onRefresh={onRefresh} />
      )}

      {isOwner && (
        <div className="space-y-4 pt-10">
          <h3 className="text-[14px] font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h3>
          <div className="bg-red-500/5 border border-red-500/30 rounded-md overflow-hidden">
            <div className="p-4 border-b border-red-500/30 bg-red-500/10">
              <h4 className="text-[14px] font-semibold text-red-500">Critical Actions</h4>
            </div>
            <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-foreground">Delete this organization</h4>
                <p className="text-[14px] text-foreground/60 max-w-md">Once you delete an organization, there is no going back. All projects, tasks, and data will be permanently wiped.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline border-border-default text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-5 py-2 text-[14px] font-bold"
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
      <div className="h-40" />
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
      const response = await apiFetch(`/organizations/${org._id}/leave`, {
        method: 'POST'
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
      <div className="bg-red-500/5 border border-red-500/30 rounded-md overflow-hidden">
        <div className="p-4 border-b border-red-500/30 bg-red-500/10">
           <h4 className="text-[14px] font-semibold text-red-500">Voluntary Departure</h4>
        </div>
        <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-[16px] font-semibold text-foreground">Leave this organization</h4>
            <p className="text-[14px] text-foreground/60 max-w-md">Once you leave, you will lose access to all projects and private data. Your work history will be preserved.</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowConfirm(true)}
            className="btn btn-outline border-border-default text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-5 py-2 text-[14px] font-bold"
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
