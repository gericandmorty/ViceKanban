import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '@/app/hooks/useNotifications';
import { Bell, Trash2, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function NotificationPopover({ 
  notifications, 
  onMarkRead, 
  onDelete, 
  onClose,
  onMarkAllAsRead
}: NotificationPopoverProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -20, x: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20, x: -10 }}
      className="absolute top-12 right-0 w-[340px] bg-[#161b22] border border-[#30363d] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-[200] overflow-hidden flex flex-col max-h-[500px]"
    >
      <div className="flex items-center justify-between p-3 border-b border-[#30363d] bg-[#161b22]">
        <h3 className="font-semibold text-xs text-[#e6edf3] flex items-center gap-2">
          Notifications
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-[#2f81f7] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {onMarkAllAsRead && notifications.some(n => !n.isRead) && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-[10px] text-[#2f81f7] hover:underline px-2 py-1 transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-[#30363d] rounded transition-colors text-[#8b949e]">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117]">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#8b949e] space-y-3">
            <Bell size={32} strokeWidth={1} className="opacity-20" />
            <p className="text-xs font-medium">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div 
                key={n._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`group relative flex gap-3 p-3.5 border-b border-[#30363d] hover:bg-[#161b22] transition-colors ${
                  !n.isRead ? 'bg-[#2f81f7]/5' : ''
                }`}
              >
                {/* Unread Indicator Bar */}
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2f81f7]" />
                )}

                {/* Avatar Section */}
                <div className="shrink-0 pt-0.5">
                  <div className="w-8 h-8 rounded-full bg-[#30363d] border border-[#30363d] overflow-hidden relative shadow-sm">
                    {n.sender?.avatarUrl ? (
                      <Image src={n.sender.avatarUrl} alt={n.sender.username} fill sizes="32px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#f0f6fc]">
                        {n.sender?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0 pr-6">
                  <Link 
                    href={n.link || '#'} 
                    onClick={onClose}
                    className="block group"
                  >
                    <div className="text-[13px] leading-[1.5]">
                      <span className="font-bold text-[#f0f6fc]">{n.sender?.username || 'System'}</span>
                      {' '}
                      <span className={!n.isRead ? 'text-[#e6edf3]' : 'text-[#8b949e]'}>
                        {n.message}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-1.5 flex items-center gap-1.5 font-medium">
                      {getRelativeTime(n.createdAt)}
                    </p>
                  </Link>
                </div>

                {/* Action Section */}
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                  {!n.isRead && (
                    <button 
                      onClick={() => onMarkRead(n._id)}
                      className="p-1.5 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#2f81f7] transition-all"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => onDelete(n._id)}
                    className="p-1.5 hover:bg-[#30363d] rounded text-[#8b949e] hover:text-[#f85149] transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-2 border-t border-[#30363d] bg-[#161b22] text-center">
        <Link 
          href="/dashboard"
          className="text-[11px] text-[#2f81f7] font-semibold hover:underline"
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </motion.div>
  );
}
