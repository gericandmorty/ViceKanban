'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { MoreHorizontal, Plus, Lock } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  creator: {
    _id: string;
    username: string;
  };
  assignee?: {
    _id: string;
    username: string;
  };
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
  onDeleteTask?: (taskId: string) => void;
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

  return (
    <div className="flex flex-col w-[calc(25%-18px)] h-full bg-[#f6f8fa]/50 dark:bg-[#161b22]/50 rounded-lg p-2 flex-shrink-0 border border-border-default/50">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground capitalize">{title.replace('_', ' ')}</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-border-default text-zinc-500">
            {tasks.length}
          </span>
          {isLocked && <Lock size={12} className="text-zinc-400 ml-1" />}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-border-default rounded transition-colors text-zinc-400">
            <MoreHorizontal size={14} />
          </button>
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
            items={tasks.map(t => t._id)} 
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                onDelete={() => onDeleteTask?.(task)}
                onClick={() => onTaskClick?.(task)}
                isOwnerOrCreator={isOwnerOrCreator}
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
