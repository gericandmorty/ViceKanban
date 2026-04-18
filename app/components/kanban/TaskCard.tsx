'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { 
  FileText, 
  User as UserIcon, 
  MessageSquare,
  Clock,
  Trash2
} from 'lucide-react';
import Cookies from 'js-cookie';
import Image from 'next/image';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  creator: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  assignee?: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onDelete?: () => void;
  onClick?: () => void;
  isOwnerOrCreator?: boolean;
  isSortingActive?: boolean;
}

export default function TaskCard({ task, onDelete, onClick, isOwnerOrCreator, isSortingActive }: TaskCardProps) {
  const currentUserId = Cookies.get('user_id');
  const isOwner = currentUserId === task.creator._id;
  const canDrag = isOwnerOrCreator || isOwner || (task.assignee && task.assignee._id === currentUserId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task._id,
    disabled: !canDrag || isSortingActive,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-bg-subtle border-2 border-accent border-dashed rounded-lg h-[100px] mb-3"
      />
    );
  }

  const isAssignedToMe = currentUserId === task.assignee?._id;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-background border rounded-lg p-3 shadow-sm hover:border-accent group mb-3 transition-all hover:shadow-md ${
        isAssignedToMe 
          ? 'border-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.15)] ring-1 ring-accent/30' 
          : 'border-border-default'
      } ${
        (canDrag && !isSortingActive) ? 'cursor-pointer active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      <div className="flex flex-col gap-2 relative">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
            {task.title}
          </h4>
          {isOwner && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-1 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        
        {task.description && (
          <p className="text-[11px] text-foreground/50 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-default/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] text-foreground/40">
              <span className="opacity-70 font-medium">By:</span>
              <span>{task.creator.username}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-[9px] text-accent font-semibold">
                <span className="opacity-70">For:</span>
                <span>{task.assignee.username}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <div className="w-6 h-6 rounded-full bg-accent border border-accent/20 flex items-center justify-center text-[9px] font-bold text-white shadow-sm overflow-hidden relative" title={`Assigned to ${task.assignee.username}`}>
                {task.assignee.avatarUrl ? (
                  <Image 
                    src={task.assignee.avatarUrl} 
                    alt={task.assignee.username} 
                    fill 
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  task.assignee.username.charAt(0).toUpperCase()
                )}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-bg-subtle border border-border-default flex items-center justify-center text-[9px] font-bold text-foreground/40 italic" title="Unassigned">
                ?
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
