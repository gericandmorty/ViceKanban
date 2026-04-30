'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/app/utils/api';
import { Loader2, Check, AlertCircle, User } from 'lucide-react';
import { setObfuscatedCookie } from '@/app/utils/cookieUtils';

interface ChangeUsernameFormProps {
  currentUsername: string;
  onSuccess?: (newUsername: string) => void;
}

export default function ChangeUsernameForm({ currentUsername, onSuccess }: ChangeUsernameFormProps) {
  const [newUsername, setNewUsername] = useState(currentUsername || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isTaken, setIsTaken] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sync state with prop if it changes
  useEffect(() => {
    if (currentUsername) {
      setNewUsername(currentUsername);
    }
  }, [currentUsername]);

  // Debounced username check
  useEffect(() => {
    const trimmed = (newUsername || '').trim();
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    const isBasicValid = trimmed.length >= 3 && !trimmed.includes(' ') && usernameRegex.test(trimmed);

    if (newUsername === currentUsername || !isBasicValid) {
      setIsTaken(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const response = await apiFetch(`/auth/check-username?username=${(newUsername || '').trim()}`);
        if (response.ok) {
          const data = await response.json();
          setIsTaken(data.exists);
        }
      } catch (err) {
        console.error('Failed to check username availability');
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, currentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUsername.trim();
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    const startEndRegex = /^(?![._])(?!.*[._]$)/;
    
    if (trimmed === currentUsername) return;
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (trimmed.includes(' ')) {
      setError('Username cannot contain spaces.');
      return;
    }
    if (!usernameRegex.test(trimmed)) {
      setError('Username can only contain letters, numbers, dots, and underscores.');
      return;
    }
    if (!startEndRegex.test(trimmed)) {
      setError('Username cannot start or end with a dot or underscore.');
      return;
    }
    if (isTaken) {
      setError('This username is already taken.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch('/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update username');
      }

      setSuccess('Username updated successfully!');
      // Update cookie
      setObfuscatedCookie('user_name', trimmed, { expires: 1/3 });
      
      if (onSuccess) {
        onSuccess(trimmed);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = (newUsername || '').trim() !== (currentUsername || '') && (newUsername || '').trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">Username</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
            <User size={16} />
          </div>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              setError('');
              setSuccess('');
            }}
            maxLength={16}
            className={`w-full bg-background border rounded-md py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 transition-all ${
              isTaken 
                ? 'border-red-500/50 focus:ring-red-500/20' 
                : 'border-border-default focus:ring-accent/40 focus:border-accent'
            }`}
            placeholder="Enter new username"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isChecking && <Loader2 size={14} className="animate-spin text-foreground/40" />}
            {!isChecking && hasChanges && !isTaken && !newUsername.includes(' ') && (
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check size={12} className="text-green-500" />
              </div>
            )}
            {!isChecking && isTaken && (
              <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={12} className="text-red-500" />
              </div>
            )}
          </div>
        </div>
        {isTaken && <p className="text-[11px] text-red-500 font-medium">This username is already taken.</p>}
        {newUsername.includes(' ') && <p className="text-[11px] text-red-500 font-medium">Username cannot contain spaces.</p>}
        <p className="text-[11px] text-foreground/40">Username must be one continuous word (no spaces).</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md flex items-center gap-2 text-green-500 text-xs">
          <Check size={14} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isChecking || !hasChanges || isTaken || newUsername.includes(' ')}
        className="btn btn-primary px-6 py-2 text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Updating...
          </>
        ) : (
          'Update Username'
        )}
      </button>
    </form>
  );
}
