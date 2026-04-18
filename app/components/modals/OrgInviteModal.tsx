'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Building2, Check, X, Loader2, Users } from 'lucide-react';
import Cookies from 'js-cookie';
import { API_URL } from '@/app/utils/api';
import toast from 'react-hot-toast';

interface OrgInviteModalProps {
  notification: {
    _id: string;
    message: string;
    link?: string;
    sender?: {
      username: string;
      avatarUrl?: string;
    };
  };
  onClose: () => void;
  onAction: (notificationId: string) => void;
}

export default function OrgInviteModal({ notification, onClose, onAction }: OrgInviteModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [orgData, setOrgData] = useState<{ name: string; avatarUrl?: string; members?: any[] } | null>(null);

  // Extract orgId from the link e.g. /dashboard?invite=<orgId>
  const orgId = notification.link?.split('invite=')?.[1] ?? null;

  // Parse org name from message as fallback: "X invited you to join <OrgName>"
  const orgNameFallback = notification.message.match(/invited you to join (.+)$/)?.[1] ?? 'this organization';

  const orgName = orgData?.name ?? orgNameFallback;
  const orgLogo = orgData?.avatarUrl;
  const memberCount = orgData?.members?.length ?? null;

  useEffect(() => {
    const token = Cookies.get('access_token');

    const fetchOrgData = async () => {
      // Primary: orgId is embedded in the notification link (new format)
      if (orgId) {
        try {
          const res = await fetch(`${API_URL}/organizations/${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setOrgData(data);
            return;
          }
        } catch {}
      }

      // Fallback: fetch user's pending invitations and match by org name
      try {
        const res = await fetch(`${API_URL}/organizations/invitations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const invites: any[] = await res.json();
          const match = invites.find(inv => inv.name === orgNameFallback);
          if (match) setOrgData(match);
        }
      } catch {}
    };

    fetchOrgData();
  }, [orgId, orgNameFallback]);

  const getToken = () => Cookies.get('access_token');

  const handleAccept = async () => {
    if (!orgId) { toast.error('Could not find organization.'); return; }
    setIsAccepting(true);
    try {
      const res = await fetch(`${API_URL}/organizations/${orgId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        toast.success(`You joined ${orgName}!`);
        onAction(notification._id);
        onClose();
        window.dispatchEvent(new Event('orgMembershipChanged'));
      } else {
        const err = await res.json();
        if (err.message === 'No pending invitation found for this organization') {
          toast.success('Invitation already accepted');
          onAction(notification._id);
          onClose();
        } else {
          toast.error(err.message || 'Failed to accept invitation');
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!orgId) { toast.error('Could not find organization.'); return; }
    setIsDeclining(true);
    try {
      const res = await fetch(`${API_URL}/organizations/${orgId}/decline`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        toast.success('Invitation declined');
        onAction(notification._id);
        onClose();
        window.dispatchEvent(new Event('orgMembershipChanged'));
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to decline invitation');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsDeclining(false);
    }
  };

  const isLoading = isAccepting || isDeclining;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          className="relative z-10 w-full max-w-[360px] bg-background border border-border-default rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {/* Top thin accent */}
          <div className="h-[3px] w-full bg-accent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-md text-foreground/60 hover:bg-border-default/50 hover:text-foreground transition-all"
          >
            <X size={14} />
          </button>

          {/* Body */}
          <div className="px-6 pt-6 pb-5 space-y-5">

            {/* ── Org Logo + Identity ── */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 bg-bg-subtle border border-border-default flex items-center justify-center">
                {orgLogo ? (
                  <Image src={orgLogo} alt={orgName} fill sizes="56px" className="object-cover" />
                ) : (
                  <Building2 size={26} className="text-accent" strokeWidth={1.5} />
                )}
              </div>

              {/* Name + badge */}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-widest mb-0.5">Organization</p>
                <h2 className="text-[18px] font-bold text-foreground leading-tight truncate">{orgName}</h2>
                {memberCount !== null && (
                  <p className="text-[11px] text-foreground/60 flex items-center gap-1 mt-0.5">
                    <Users size={11} className="opacity-70" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </p>
                )}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border-default" />

            {/* ── Inviter card ── */}
            {notification.sender && (
              <div className="flex items-center gap-3">
                {/* Inviter avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0 bg-bg-subtle border border-border-default">
                  {notification.sender.avatarUrl ? (
                    <Image
                      src={notification.sender.avatarUrl}
                      alt={notification.sender.username}
                      fill sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-foreground">
                      {notification.sender.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-foreground/60">Invited by</p>
                  <p className="text-[13px] font-semibold text-foreground">{notification.sender.username}</p>
                </div>
              </div>
            )}

            {/* ── Description ── */}
            <p className="text-[13px] text-foreground/80 leading-relaxed">
              You've been invited to collaborate in{' '}
              <span className="text-foreground font-medium">{orgName}</span>.
              {' '}This invitation will expire in 24 hours.
            </p>

            {/* ── Action Buttons ── */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleDecline}
                disabled={isLoading}
                className="btn btn-outline flex-1 py-1.5 text-[13px]"
              >
                {isDeclining ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="btn btn-primary flex-1 py-1.5 text-[13px]"
              >
                {isAccepting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Accept invitation
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
