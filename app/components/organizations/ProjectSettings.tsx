'use client';

import React, { useState } from 'react';
import { Save, Loader2, Type, FileText, AlertTriangle, Trash2 } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/app/utils/api';
import DangerZoneModal from '../ui/DangerZoneModal';

interface ProjectSettingsProps {
  project: any;
  orgId: string;
  isAdmin: boolean;
  isOrgOwner: boolean;
  isCreator: boolean;
  onRefresh: () => void;
}

export default function ProjectSettings({ project, orgId, isAdmin, isOrgOwner, isCreator, onRefresh }: ProjectSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canEdit = isAdmin || isCreator;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/projects/${project._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        toast.success('Project updated successfully');
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update project');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/projects/${project._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Project deleted successfully');
        setShowDeleteModal(false);
        // Redirect to org home
        router.push(`/dashboard?orgId=${orgId}`);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete project');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-2 border-b border-border-default pb-6">
        <h2 className="text-[32px] font-bold text-foreground">Project Settings</h2>
        <p className="text-[14px] text-foreground/60">
          Manage your project name and description.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-semibold text-foreground uppercase tracking-wide">General Details</h3>
        
        <form onSubmit={handleUpdate} className="bg-background border border-border-default rounded-md overflow-hidden">
          {/* Project Name Row */}
          <div className="px-6 py-6 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-foreground w-full sm:w-1/3">
              Project name
            </label>
            <div className="w-full sm:w-2/3">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit || isUpdating}
                className="w-full px-3 py-[5px] bg-background border border-border-default rounded-md text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Project Description Row */}
          <div className="px-6 py-6 border-b border-border-default flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors">
            <label className="text-[14px] font-semibold text-foreground w-full sm:w-1/3 mt-1">
              Description
            </label>
            <div className="w-full sm:w-2/3">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit || isUpdating}
                placeholder="Add a description for your project..."
                className="w-full px-3 py-[7px] bg-background border border-border-default rounded-md text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all min-h-[120px] resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-bg-subtle flex justify-end gap-3 items-center">
            {canEdit && (
              <>
                <button 
                  type="button"
                  onClick={() => { setName(project.name); setDescription(project.description || ''); }}
                  className="text-[14px] text-foreground/60 hover:text-foreground transition-colors px-3 py-[5px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating || !name.trim() || (name === project.name && description === (project.description || ''))}
                  className="btn btn-primary px-4 py-[5px] text-[14px]"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {isOrgOwner && (
        <div className="space-y-4 pt-4">
          <h3 className="text-[14px] font-semibold text-red-500 uppercase tracking-wide">Danger Zone</h3>
          <div className="bg-red-500/5 border border-red-500/30 rounded-md overflow-hidden">
            <div className="px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-[16px] font-semibold text-foreground">Delete this project</h4>
                <p className="text-[14px] text-foreground/60 max-w-md">Once you delete this project, there is no going back. All tasks and history will be permanently wiped.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline border-border-default text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-5 py-2 text-[14px] font-bold"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      <DangerZoneModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        itemName={project.name}
        itemType="project"
        isLoading={isDeleting}
      />
    </div>
  );
}
