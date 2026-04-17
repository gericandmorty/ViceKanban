'use client';

import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { MoreHorizontal, Plus, Lock, ArrowUpAz, ArrowDownAz, ListOrdered, Calendar } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  creator: {
    _id: string;
    username: string;
  };
  assignee?: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
  onDeleteTask?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  isOwnerOrCreator: boolean;
  isLocked?: boolean;
}

export default function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  onAddTask,
  onDeleteTask,
  onTaskClick,
  isOwnerOrCreator,
  isLocked 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    disabled: isLocked, // Prevent dropping if locked (permissions)
    data: {
      type: 'Column',
      status: id
    }
  });
  
  const [sortOrder, setSortOrder] = useState<'manual' | 'newest' | 'oldest'>('manual');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayTasks = useMemo(() => {
    if (sortOrder === 'newest') {
      return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sortOrder === 'oldest') {
      return [...tasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return tasks;
  }, [tasks, sortOrder]);

  return (
    <div 
      id={`column-${id}`}
      className="flex flex-col w-[85vw] sm:w-[300px] md:w-[calc(25%-18px)] h-full bg-[#f6f8fa]/50 dark:bg-[#161b22]/50 rounded-xl p-2.5 flex-shrink-0 border border-border-default/50 snap-center shadow-sm"
    >
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground capitalize">{title.replace('_', ' ')}</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-border-default text-zinc-500">
            {tasks.length}
          </span>
          {isLocked && <Lock size={12} className="text-zinc-400 ml-1" />}
        </div>
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1 rounded transition-colors ${isMenuOpen ? 'bg-border-default text-accent' : 'text-zinc-400 hover:bg-border-default'}`}
          >
            <MoreHorizontal size={14} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-[#30363d] flex items-center gap-2">
                  <Calendar size={12} className="text-zinc-500" />
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Column Actions</span>
                </div>

                {!isLocked && onAddTask && (
                  <button 
                    onClick={() => { onAddTask(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-[#1f242c] transition-colors border-b border-[#30363d]/50"
                  >
                    <Plus size={14} className="text-accent" />
                    Add Task
                  </button>
                )}
                
                <button 
                  onClick={() => { setSortOrder('manual'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${sortOrder === 'manual' ? 'text-accent bg-accent/5' : 'text-zinc-300 hover:bg-[#1f242c]'}`}
                >
                  <ListOrdered size={14} />
                  Manual Sort
                </button>
                
                <button 
                  onClick={() => { setSortOrder('newest'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${sortOrder === 'newest' ? 'text-accent bg-accent/5' : 'text-zinc-300 hover:bg-[#1f242c]'}`}
                >
                  <ArrowDownAz size={14} />
                  Newest First
                </button>
                
                <button 
                  onClick={() => { setSortOrder('oldest'); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${sortOrder === 'oldest' ? 'text-accent bg-accent/5' : 'text-zinc-300 hover:bg-[#1f242c]'}`}
                >
                  <ArrowUpAz size={14} />
                  Oldest First
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto rounded-md transition-colors ${
          isOver ? (isLocked ? 'bg-red-500/5' : 'bg-accent/5') : ''
        }`}
      >
        <div className="p-1 pb-4 min-h-[100px]">
          <SortableContext 
            items={displayTasks.map(t => t._id)} 
            strategy={verticalListSortingStrategy}
          >
            {displayTasks.map((task) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                onDelete={() => onDeleteTask?.(task)}
                onClick={() => onTaskClick?.(task)}
                isOwnerOrCreator={isOwnerOrCreator}
                isSortingActive={sortOrder !== 'manual'}
              />
            ))}
          </SortableContext>

          {!isLocked && onAddTask && (
            <button 
              onClick={onAddTask}
              className="w-full flex items-center gap-2 px-2 py-2 text-xs text-zinc-500 hover:text-accent hover:bg-bg-subtle rounded-lg transition-all group"
            >
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              Add a card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
