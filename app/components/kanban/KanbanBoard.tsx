'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  rectIntersection
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { Loader2, Plus, X, Type, FileText, User as UserIcon, Trash2, MessageSquare, Send, CornerDownRight, Maximize2, Kanban, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { API_URL, apiFetch } from '@/app/utils/api';
import { compressImage } from '@/app/utils/imageUtils';
import ConfirmationModal from '../ui/ConfirmationModal';
import Image from 'next/image';
import Loading from '@/app/components/ui/Loading';
import { useSearchParams } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  creator: {
    username: string;
    _id: string;
    avatarUrl?: string;
  };
  assignee?: {
    username: string;
    _id: string;
    avatarUrl?: string;
  };
  assignees?: {
    username: string;
    _id: string;
    avatarUrl?: string;
  }[];
  createdAt: string;
  startDate?: string;
  dueDate?: string;
  imageUrl?: string;
}

interface KanbanBoardProps {
  projectId: string;
  isOwnerOrCreator: boolean;
  orgOwnerId: string;
  members: any[];
}

export default function KanbanBoard({ projectId, isOwnerOrCreator, orgOwnerId, members }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [board, setBoard] = useState<{ columns: { id: string, title: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState<{status: string} | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskPriority, setNewTaskPriority] = useState('low');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskImage, setNewTaskImage] = useState<File | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [taskToConfirmDelete, setTaskToConfirmDelete] = useState<Task | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [filterOnlyMe, setFilterOnlyMe] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<string[]>([]);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get('taskId');
  
  // Edit Task State
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('low');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);
  const [isEditAssigneeDropdownOpen, setIsEditAssigneeDropdownOpen] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const currentUserId = Cookies.get('user_id');
  const isOrgOwner = currentUserId === orgOwnerId;
  const isCoOwner = members?.find(m => (m.user?._id || m.user) === currentUserId)?.role === 'co-owner';
  const canEditDates = isOrgOwner || isCoOwner;

  const getTaskAssignees = useCallback((task: Task | null) => {
    if (!task) return [] as NonNullable<Task['assignees']>;
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
      return task.assignees;
    }
    return task.assignee ? [task.assignee] : [];
  }, []);

  const fetchMyProfile = useCallback(async () => {
    try {
      const response = await apiFetch('/user/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserAvatar(data.avatarUrl);
      }
    } catch (error) {
      console.error('Failed to fetch my profile:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch Board and Tasks in parallel using apiFetch
      const [boardRes, tasksRes] = await Promise.all([
        apiFetch(`/kanban/project/${projectId}`),
        apiFetch(`/tasks/project/${projectId}`)
      ]);

      if (boardRes.ok && tasksRes.ok) {
        const boardData = await boardRes.json();
        const tasksData = await tasksRes.json();
        setBoard(boardData);
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    fetchMyProfile();
    
    // Load collapsed columns from localStorage
    const saved = localStorage.getItem('vk_collapsed_cols');
    if (saved) {
      try {
        setCollapsedCols(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse collapsed columns:', e);
      }
    }
  }, [fetchData, fetchMyProfile]);
  
  // Handle taskId highlight from URL
  useEffect(() => {
    if (urlTaskId && tasks.length > 0) {
      const taskExists = tasks.some(t => t._id === urlTaskId);
      if (taskExists) {
        setHighlightedTaskId(urlTaskId);
        
        // Scroll to the task
        setTimeout(() => {
           const element = document.getElementById(`task-${urlTaskId}`);
           if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
        }, 300);

        // Remove highlight after animation
        const timer = setTimeout(() => setHighlightedTaskId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [urlTaskId, tasks]);

  // Save collapsed columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vk_collapsed_cols', JSON.stringify(collapsedCols));
  }, [collapsedCols]);

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedCols(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId) 
        : [...prev, columnId]
    );
  };

  const fetchComments = useCallback(async (taskId: string) => {
    setIsFetchingComments(true);
    try {
      const response = await apiFetch(`/comments/task/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsFetchingComments(false);
    }
  }, []);

  useEffect(() => {
    if (inspectingTask) {
      fetchComments(inspectingTask._id);
      setEditTitle(inspectingTask.title);
      setEditDescription(inspectingTask.description || '');
      setEditPriority((inspectingTask as any).priority || 'low');
      setEditStartDate(inspectingTask.startDate ? new Date(inspectingTask.startDate).toISOString().split('T')[0] : '');
      setEditDueDate(inspectingTask.dueDate ? new Date(inspectingTask.dueDate).toISOString().split('T')[0] : '');
      setEditAssigneeIds(getTaskAssignees(inspectingTask).map((a) => a._id));
      setIsEditAssigneeDropdownOpen(false);
      setIsEditingTask(false);
    } else {
      setComments([]);
      setNewCommentContent('');
      setReplyingTo(null);
      setEditAssigneeIds([]);
      setIsEditAssigneeDropdownOpen(false);
      setIsEditingTask(false);
    }
  }, [inspectingTask, fetchComments, getTaskAssignees]);

  const handleCreateComment = async (parentId?: string) => {
    if (!newCommentContent.trim() || !inspectingTask || isSendingComment) return;

    setIsSendingComment(true);
    try {
      const response = await apiFetch('/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: inspectingTask._id,
          content: newCommentContent,
          parentId: parentId
        })
      });

      if (response.ok) {
        setNewCommentContent('');
        setReplyingTo(null);
        fetchComments(inspectingTask._id);
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim() || !inspectingTask) return;

    try {
      const response = await apiFetch(`/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingContent })
      });

      if (response.ok) {
        setEditingCommentId(null);
        setEditingContent('');
        fetchComments(inspectingTask._id);
        toast.success('Comment updated');
      } else {
        toast.error('Failed to update comment');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!inspectingTask) return;

    try {
      const apiUrl = API_URL;
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchComments(inspectingTask._id);
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToConfirmDelete) return;
    const taskId = taskToConfirmDelete._id;

    try {
      const response = await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Task deleted');
        setTaskToConfirmDelete(null);
        setInspectingTask(null);
        refreshTasks();
        window.dispatchEvent(new CustomEvent('taskUpdated')); // Sync sidebar
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };
  
  const handleUpdateTask = async () => {
    if (!inspectingTask || !editTitle.trim() || isUpdatingTask) return;

    setIsUpdatingTask(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      formData.append('priority', editPriority);
      formData.append('assigneeIds', JSON.stringify(editAssigneeIds));
      if (editStartDate) formData.append('startDate', editStartDate);
      if (editDueDate) formData.append('dueDate', editDueDate);
      
      if (newTaskImage) {
        const compressed = await compressImage(newTaskImage);
        formData.append('image', compressed);
      }

      const response = await apiFetch(`/tasks/${inspectingTask._id}`, {
        method: 'PATCH',
        body: formData
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        setInspectingTask(updatedTask);
        setIsEditingTask(false);
        setNewTaskImage(null); // Reset image state
        toast.success('Task updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update task');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  // Use fetchData instead of fetchTasks
  const refreshTasks = fetchData;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    // Performance Optimization: Only trigger state update if task crosses column boundary
    if (isActiveATask && isOverAColumn) {
      const overStatus = over.data.current?.status;
      
      if (overStatus === 'reviewed' && !isOwnerOrCreator) {
        return;
      }

      setTasks((prevTasks) => {
        const activeIndex = prevTasks.findIndex((t) => t._id === activeId);
        if (activeIndex === -1) return prevTasks;
        
        // Only update if the status actually changed to avoid "spamming" state
        if (prevTasks[activeIndex].status === overStatus) return prevTasks;

        const newTasks = [...prevTasks];
        newTasks[activeIndex] = { ...newTasks[activeIndex], status: overStatus };
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine target status and target order
    let newStatus = '';
    let newOrder = 0;

    if (over.data.current?.type === 'Column') {
      newStatus = over.data.current.status;
      const tasksInCol = tasks.filter(t => t.status === newStatus && t._id !== activeId);
      if (tasksInCol.length > 0) {
        newOrder = tasksInCol[tasksInCol.length - 1].order + 1000;
      } else {
        newOrder = 1000;
      }
    } else if (over.data.current?.type === 'Task') {
      newStatus = over.data.current.task.status;
      const overIndex = tasks.findIndex(t => t._id === overId);
      const overStatus = tasks[overIndex].status;

      // Vertical sorting logic
      const tasksInSameStatus = tasks.filter(t => t.status === overStatus && t._id !== activeId);
      const taskBelowIndex = tasksInSameStatus.findIndex(t => t._id === overId);
      
      const prevTask = tasksInSameStatus[taskBelowIndex - 1];
      const nextTask = tasksInSameStatus[taskBelowIndex];

      if (!nextTask) {
        // Dropped at the very bottom of the relative list
        newOrder = (prevTask?.order || 0) + 1000;
      } else if (!prevTask) {
        // Dropped at the very top
        newOrder = nextTask.order / 2;
      } else {
        // Dropped between two tasks
        newOrder = (prevTask.order + nextTask.order) / 2;
      }
    }

    if (!newStatus) return;

    // Permission check
    if (newStatus === 'reviewed' && !isOwnerOrCreator) {
      toast.error('Only owners or curators can move tasks to Reviewed');
      refreshTasks(); // Revert local optimistic change
      return;
    }

    // Update backend
    try {
      const response = await apiFetch(`/tasks/${activeId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, order: newOrder })
      });

      if (response.ok) {
        refreshTasks(); // Refresh to get precise order from server
        window.dispatchEvent(new CustomEvent('taskUpdated')); // Sync sidebar
        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      } else {
        toast.error('Failed to update task position');
        refreshTasks();
      }
    } catch (error) {
      toast.error('Connection error');
      refreshTasks();
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const tasksInCol = tasks.filter(t => t.status === newStatus);
      const newOrder = tasksInCol.length > 0 ? Math.max(...tasksInCol.map(t => t.order)) + 1000 : 1000;

      const response = await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, order: newOrder })
      });

      if (response.ok) {
        refreshTasks();
        window.dispatchEvent(new CustomEvent('taskUpdated'));
        if (inspectingTask?._id === taskId) {
           setInspectingTask(prev => prev ? { ...prev, status: newStatus } : null);
        }
        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to move task');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !showTaskForm) return;

    setIsCreatingTask(true);
    try {
      const formData = new FormData();
      formData.append('title', newTaskTitle);
      formData.append('description', newTaskDesc);
      formData.append('projectId', projectId);
      formData.append('priority', newTaskPriority);
      if (newTaskAssignees.length > 0) {
        formData.append('assigneeIds', JSON.stringify(newTaskAssignees));
      }
      if (newTaskStartDate) formData.append('startDate', newTaskStartDate);
      if (newTaskDueDate) formData.append('dueDate', newTaskDueDate);
      
      if (newTaskImage) {
        const compressed = await compressImage(newTaskImage);
        formData.append('image', compressed);
      }

      const response = await apiFetch('/tasks', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskAssignees([]);
        setNewTaskPriority('low');
        setNewTaskStartDate('');
        setNewTaskDueDate('');
        setNewTaskImage(null);
        setShowTaskForm(null);
        refreshTasks();
        window.dispatchEvent(new CustomEvent('taskUpdated')); // Sync sidebar
        toast.success('Task created successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Only owners can create tasks');
      }
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden h-full pb-2 flex flex-col">
      {/* Board Toolbar */}
      <div className="flex items-center justify-between px-2 mb-3 md:mb-4 shrink-0">
        <div className="flex items-center gap-1.5 bg-bg-subtle p-1 rounded-lg border border-border-default self-start">
          <button 
            onClick={() => setFilterOnlyMe(false)}
            className={`px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all ${
              !filterOnlyMe 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-foreground/40 hover:text-foreground'
            }`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setFilterOnlyMe(true)}
            className={`px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              filterOnlyMe 
                ? 'bg-accent text-white shadow-sm' 
                : 'text-foreground/40 hover:text-foreground'
            }`}
          >
            <UserIcon size={12} />
            My Tasks
          </button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-3 md:gap-6 px-2 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory pb-4 min-h-0 touch-pan-x">
          {board?.columns.map((col) => {
            const columnTasks = tasks.filter(t => t.status === col.id);
            const displayTasks = filterOnlyMe 
              ? columnTasks.filter(t => getTaskAssignees(t).some((a) => a._id === currentUserId))
              : columnTasks;

            return (
              <KanbanColumn 
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={displayTasks}
                onAddTask={(col.id === 'todo' && isOwnerOrCreator) ? () => setShowTaskForm({status: col.id}) : undefined}
                onDeleteTask={(task) => setTaskToConfirmDelete(task)}
                onTaskClick={setInspectingTask}
                isOwnerOrCreator={isOwnerOrCreator}
                isLocked={col.id === 'reviewed' && !isOwnerOrCreator}
                isCollapsed={collapsedCols.includes(col.id)}
                onToggleCollapse={() => toggleColumnCollapse(col.id)}
                isCompact={col.id === 'reviewed'}
                highlightedTaskId={highlightedTaskId}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-72 touch-none pointer-events-none opacity-80 cursor-grabbing shadow-2xl skew-y-1">
              <TaskCard task={activeTask} isSortingActive={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Inline Task Creation Modal */}
      <AnimatePresence>
        {showTaskForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskForm(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-background border border-border-default rounded-xl shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-subtle rounded-t-xl">
                <h3 className="font-bold flex items-center gap-2 text-foreground">
                  <Plus size={16} className="text-accent" />
                  Add New Task
                </h3>
                <button onClick={() => setShowTaskForm(null)} className="text-foreground/40 hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase">Task Title</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" size={14} />
                    <input 
                      autoFocus
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-foreground/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2 text-foreground/20" size={14} />
                    <textarea 
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Optional details..."
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all min-h-[80px] resize-none placeholder:text-foreground/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Start Date</label>
                    <input 
                      type="date"
                      value={newTaskStartDate}
                      onChange={(e) => setNewTaskStartDate(e.target.value)}
                      className="w-full bg-background border border-border-default rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Due Date</label>
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-background border border-border-default rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTaskPriority(p)}
                        className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase border transition-all ${
                          newTaskPriority === p 
                            ? p === 'urgent' ? 'bg-red-500 border-red-600 text-white shadow-sm' :
                              p === 'high' ? 'bg-yellow-500 border-yellow-600 text-black shadow-sm' :
                              p === 'medium' ? 'bg-blue-500 border-blue-600 text-white shadow-sm' :
                              'bg-green-500 border-green-600 text-white shadow-sm'
                            : 'bg-bg-subtle border-border-default text-foreground/40 hover:text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {isOwnerOrCreator && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Assign To</label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20 group-hover:text-accent transition-colors" size={14} />
                        <span className="text-foreground text-xs md:text-sm min-w-0">
                          {newTaskAssignees.length > 0 ? (
                            <span className="whitespace-nowrap">{newTaskAssignees.length} selected</span>
                          ) : (
                            <span className="text-foreground/50 whitespace-nowrap">No assignee</span>
                          )}
                        </span>
                        <div className={`transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`}>
                          <Send size={10} className="rotate-90 text-foreground/40" />
                        </div>
                      </div>

                      {/* Custom Dropdown List */}
                      <AnimatePresence>
                        {isAssigneeDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-[120]" 
                              onClick={() => setIsAssigneeDropdownOpen(false)}
                            />
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 mt-1 bg-background border border-border-default rounded-lg shadow-xl z-[130] overflow-hidden"
                            >
                              <div className="max-h-[160px] overflow-y-auto custom-scrollbar py-1">
                                <div 
                                  onClick={() => {
                                    setNewTaskAssignees([]);
                                    setIsAssigneeDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-accent hover:text-white transition-colors flex items-center gap-2 ${newTaskAssignees.length === 0 ? 'bg-accent/10 text-accent font-semibold' : 'text-foreground/60'}`}
                                >
                                  <div className="w-5 h-5 rounded-full border border-dashed border-border-default flex items-center justify-center text-[10px]">
                                    <X size={10} />
                                  </div>
                                  Unassigned
                                </div>
                                {members.map((member: any) => (
                                  <div 
                                    key={member.user._id}
                                    onClick={() => {
                                      setNewTaskAssignees((prev) =>
                                        prev.includes(member.user._id)
                                          ? prev.filter((id) => id !== member.user._id)
                                          : [...prev, member.user._id]
                                      );
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-accent hover:text-white transition-colors flex items-center gap-2 ${newTaskAssignees.includes(member.user._id) ? 'bg-accent/10 text-accent font-semibold' : 'text-foreground'}`}
                                  >
                                    <div className="w-5 h-5 rounded-full bg-bg-subtle flex items-center justify-center text-[10px] font-bold overflow-hidden relative border border-border-default">
                                      {member?.user?.avatarUrl ? (
                                        <Image src={member.user.avatarUrl} alt={member.user.username || 'User'} fill sizes="20px" className="object-cover" />
                                      ) : (
                                        member?.user?.username?.charAt(0).toUpperCase() || '?'
                                      )}
                                    </div>
                                    <span className="truncate">{member.user.username}</span>
                                    {newTaskAssignees.includes(member.user._id) && (
                                      <span className="ml-auto text-[10px] font-bold">Selected</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {newTaskAssignees.length > 0 && (
                      <div className="flex flex-nowrap items-center gap-1.5 pt-1 overflow-x-auto overflow-y-hidden pb-2">
                        {newTaskAssignees.map((id) => {
                          const selected = members.find((m: any) => m.user._id === id)?.user;
                          if (!selected) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 shrink-0 whitespace-nowrap">
                              {selected.username}
                              <button
                                type="button"
                                onClick={() => setNewTaskAssignees((prev) => prev.filter((item) => item !== id))}
                                className="hover:text-red-500"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground/40 uppercase">Task Image (Max 10MB)</label>
                  <div className="relative group/upload">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Image size must be less than 10MB');
                            e.target.value = '';
                            setNewTaskImage(null);
                          } else {
                            setNewTaskImage(file);
                          }
                        }
                      }}
                      className="hidden"
                      id="task-image-upload"
                    />
                    <label 
                      htmlFor="task-image-upload"
                      className="w-full flex items-center gap-3 px-4 py-3 bg-background border border-border-default border-dashed rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                      {newTaskImage ? (
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border-default shrink-0">
                            <Image 
                              src={URL.createObjectURL(newTaskImage)} 
                              alt="Preview" 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{newTaskImage.name}</p>
                            <p className="text-[10px] text-foreground/40">{(newTaskImage.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setNewTaskImage(null);
                            }}
                            className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-md bg-bg-subtle border border-border-default flex items-center justify-center text-foreground/20 group-hover:text-accent group-hover:border-accent/30 transition-all">
                            <Plus size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground/60 group-hover:text-foreground transition-all">Click to upload image</span>
                            <span className="text-[10px] text-foreground/30">PNG, JPG, WEBP or GIF</span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isCreatingTask || !newTaskTitle}
                  className="w-full btn btn-primary py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreatingTask ? <Loader2 className="animate-spin" size={18} /> : 'Create Task'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Task Detail Modal */}
      <AnimatePresence>
        {inspectingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border-default w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 border border-border-default rounded-md text-foreground/60 bg-background">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-foreground">Task Details</h2>
                    <p className="text-[10px] text-foreground/40 font-mono uppercase tracking-wider">ID: {inspectingTask._id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectingTask(null)}
                  className="p-1 px-2 text-foreground/40 hover:text-foreground hover:bg-border-default rounded-md transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-background">
                {/* Title Section */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-foreground/40">Title</label>
                  {isEditingTask ? (
                    <input 
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-background border border-border-default rounded-lg px-4 py-2 text-[18px] font-bold text-foreground outline-none focus:ring-1 focus:ring-accent"
                    />
                  ) : (
                    <h1 className="text-[24px] font-bold text-foreground tracking-tight">
                      {inspectingTask.title}
                    </h1>
                  )}
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-8 border-y border-border-default">
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground/40 uppercase tracking-tight">Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        inspectingTask.status === 'reviewed' ? 'bg-green-500' :
                        inspectingTask.status === 'done' ? 'bg-green-600' :
                        inspectingTask.status === 'in_progress' ? 'bg-accent' : 'bg-foreground/20'
                      }`} />
                      <span className="text-[14px] font-medium text-foreground capitalize">{inspectingTask.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground/40 uppercase tracking-tight">Timeline</label>
                    <div className="flex flex-col gap-1">
                      {isEditingTask && canEditDates ? (
                        <div className="flex flex-col gap-2">
                          <input 
                            type="date" 
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="bg-background border border-border-default rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-accent outline-none"
                          />
                          <input 
                            type="date" 
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-background border border-border-default rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-accent outline-none"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-foreground/40 w-8">Start:</span>
                            <span className="text-foreground font-medium">
                              {inspectingTask.startDate ? new Date(inspectingTask.startDate).toLocaleDateString() : 'Set start'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="text-foreground/40 w-8">Due:</span>
                            <span className="text-foreground font-medium">
                              {inspectingTask.dueDate ? new Date(inspectingTask.dueDate).toLocaleDateString() : 'Set due'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground/40 uppercase tracking-tight">Priority</label>
                    <div className="flex items-center gap-2">
                       {isEditingTask ? (
                          <div className="flex flex-wrap gap-1.5">
                             {['low', 'medium', 'high', 'urgent'].map(p => (
                                <button 
                                   key={p}
                                   onClick={() => setEditPriority(p)}
                                   className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                      editPriority === p 
                                         ? p === 'urgent' ? 'bg-red-500 text-white' :
                                           p === 'high' ? 'bg-yellow-500 text-black' :
                                           p === 'medium' ? 'bg-blue-500 text-white' :
                                           'bg-green-500 text-white'
                                         : 'bg-bg-subtle text-foreground/20 hover:text-foreground'
                                   }`}
                                >
                                   {p}
                                </button>
                             ))}
                          </div>
                       ) : (
                          <div className="flex items-center gap-2">
                             <div className={`w-2.5 h-2.5 rounded-full ${
                                (inspectingTask as any).priority === 'urgent' ? 'bg-red-500' :
                                (inspectingTask as any).priority === 'high' ? 'bg-yellow-500' :
                                (inspectingTask as any).priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                             }`} />
                             <span className="text-[14px] font-medium text-foreground capitalize">{(inspectingTask as any).priority || 'Low'}</span>
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-foreground/40 uppercase tracking-tight">Creator</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-bg-subtle flex items-center justify-center text-[10px] font-bold overflow-hidden relative border border-border-default shadow-sm text-foreground">
                        {inspectingTask.creator?.avatarUrl ? (
                          <Image src={inspectingTask.creator.avatarUrl} alt={inspectingTask.creator.username || 'Owner'} fill sizes="24px" className="object-cover" />
                        ) : (
                          inspectingTask.creator?.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-foreground">{inspectingTask.creator.username}</span>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Quick Actions: Move to Status */}
                <div className="sm:hidden space-y-3 pt-6 border-t border-border-default">
                   <div className="flex items-center gap-2 px-1">
                      <Kanban size={16} className="text-foreground/60" />
                      <label className="text-[14px] font-semibold text-foreground uppercase tracking-tight">Quick Move</label>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      {board?.columns.map(col => (
                         <button
                            key={col.id}
                            disabled={inspectingTask.status === col.id}
                            onClick={() => handleUpdateStatus(inspectingTask._id, col.id)}
                            className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                               inspectingTask.status === col.id
                                  ? 'bg-bg-subtle/50 border-border-default/50 text-foreground/20 grayscale'
                                  : 'bg-accent/5 border-accent/10 text-accent hover:bg-accent/10 active:scale-[0.98]'
                            }`}
                         >
                            <span className="truncate">To {col.title.replace('_', ' ')}</span>
                            {inspectingTask.status !== col.id && <ArrowRight size={14} className="shrink-0" />}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] font-semibold text-foreground/40 uppercase tracking-tight">Assignees</label>
                  {isEditingTask ? (
                    <div className="space-y-2">
                      <div className="relative max-w-md">
                        <div
                          onClick={() => setIsEditAssigneeDropdownOpen(!isEditAssigneeDropdownOpen)}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-border-default rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25 group-hover:text-accent transition-colors" size={16} />
                          <span className="text-foreground text-sm font-semibold">
                            {editAssigneeIds.length > 0 ? `${editAssigneeIds.length} selected` : 'No assignee'}
                          </span>
                          <div className={`transition-transform duration-200 ${isEditAssigneeDropdownOpen ? 'rotate-180' : ''}`}>
                            <Send size={10} className="rotate-90 text-foreground/40" />
                          </div>
                        </div>

                        <AnimatePresence>
                          {isEditAssigneeDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[120]"
                                onClick={() => setIsEditAssigneeDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-0 right-0 mt-2 bg-background border border-border-default rounded-xl shadow-xl z-[130] overflow-hidden"
                              >
                                <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1.5">
                                  <div
                                    onClick={() => {
                                      setEditAssigneeIds([]);
                                      setIsEditAssigneeDropdownOpen(false);
                                    }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-accent hover:text-white transition-colors flex items-center gap-2 ${editAssigneeIds.length === 0 ? 'bg-accent/10 text-accent font-semibold' : 'text-foreground/70'}`}
                                  >
                                    <div className="w-5 h-5 rounded-full border border-dashed border-border-default flex items-center justify-center text-[10px]">
                                      <X size={10} />
                                    </div>
                                    No assignee
                                  </div>
                                  {members.map((member: any) => (
                                    <div
                                      key={member.user._id}
                                      onClick={() => {
                                        setEditAssigneeIds((prev) =>
                                          prev.includes(member.user._id)
                                            ? prev.filter((id) => id !== member.user._id)
                                            : [...prev, member.user._id]
                                        );
                                      }}
                                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-accent hover:text-white transition-colors flex items-center gap-2 ${editAssigneeIds.includes(member.user._id) ? 'bg-accent/10 text-accent font-semibold' : 'text-foreground'}`}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-bg-subtle flex items-center justify-center text-[10px] font-bold overflow-hidden relative border border-border-default">
                                        {member?.user?.avatarUrl ? (
                                          <Image src={member.user.avatarUrl} alt={member.user.username || 'User'} fill sizes="24px" className="object-cover" />
                                        ) : (
                                          member?.user?.username?.charAt(0).toUpperCase() || '?'
                                        )}
                                      </div>
                                      <span className="text-sm">{member.user.username}</span>
                                      {editAssigneeIds.includes(member.user._id) && (
                                        <span className="ml-auto text-[10px] font-bold">Selected</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {editAssigneeIds.length > 0 && (
                        <div className="flex flex-nowrap items-center gap-2 pt-1 overflow-x-auto overflow-y-hidden pb-2">
                          {editAssigneeIds.map((id) => {
                            const selected = members.find((m: any) => m.user._id === id)?.user;
                            if (!selected) return null;
                            return (
                              <span key={id} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 shrink-0 whitespace-nowrap">
                                {selected.username}
                                <button
                                  type="button"
                                  onClick={() => setEditAssigneeIds((prev) => prev.filter((item) => item !== id))}
                                  className="hover:text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : getTaskAssignees(inspectingTask).length > 0 ? (
                    <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-2">
                      {getTaskAssignees(inspectingTask).map((assignee) => (
                        <div key={assignee._id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/20 bg-accent/10 shrink-0 whitespace-nowrap">
                          <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent overflow-hidden relative border border-accent/20 shadow-sm">
                            {assignee.avatarUrl ? (
                              <Image src={assignee.avatarUrl} alt={assignee.username || 'Assignee'} fill sizes="24px" className="object-cover" />
                            ) : (
                              assignee.username?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <span className="text-[14px] font-medium text-foreground">{assignee.username}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[14px] text-foreground/30 italic font-normal">No assignee</span>
                  )}
                </div>
                
                {/* Image Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                       <Plus size={16} className="text-foreground/60" />
                       <label className="text-[14px] font-semibold text-foreground">Task Image</label>
                    </div>
                    {isEditingTask && (
                      <button 
                        onClick={() => document.getElementById('edit-task-image')?.click()}
                        className="text-[12px] font-bold text-accent hover:underline flex items-center gap-1"
                      >
                         <Plus size={12} />
                         {inspectingTask.imageUrl || newTaskImage ? 'Change Image' : 'Add Image'}
                      </button>
                    )}
                  </div>
                  
                  <div 
                    onClick={() => (inspectingTask.imageUrl || newTaskImage) && setIsImageExpanded(true)}
                    className={`relative w-full rounded-xl overflow-hidden bg-bg-subtle border border-border-default shadow-inner group/img transition-all ${
                      (inspectingTask.imageUrl || newTaskImage) ? 'cursor-zoom-in' : ''
                    }`}
                  >
                    <motion.div
                      whileHover={ (inspectingTask.imageUrl || newTaskImage) ? { scale: 1.05 } : {} }
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="w-full h-full"
                    >
                      {newTaskImage ? (
                        <Image 
                          src={URL.createObjectURL(newTaskImage)} 
                          alt="Preview" 
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="w-full h-auto block" 
                        />
                      ) : inspectingTask.imageUrl ? (
                        <Image 
                          src={inspectingTask.imageUrl} 
                          alt={inspectingTask.title} 
                          width={0}
                          height={0}
                          sizes="100vw"
                          className="w-full h-auto block" 
                        />
                      ) : (
                        <div className="aspect-video flex flex-col items-center justify-center text-foreground/20">
                          <Plus size={48} className="opacity-10 mb-2" />
                          <span className="text-xs font-medium opacity-40">No image attached</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Hover Overlay */}
                    {(inspectingTask.imageUrl || newTaskImage) && (
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100 pointer-events-none">
                        <div className="flex flex-col items-center gap-2 transform scale-50 group-hover/img:scale-100 transition-all duration-300">
                          <div className="bg-background/80 backdrop-blur-md p-2.5 rounded-full shadow-xl border border-white/20">
                            <Maximize2 size={20} className="text-foreground" />
                          </div>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                            Click to expand
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {isEditingTask && (
                      <input 
                        type="file"
                        id="edit-task-image"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('Image size must be less than 10MB');
                              e.target.value = '';
                            } else {
                              setNewTaskImage(file);
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Type size={16} className="text-foreground/60" />
                    <label className="text-[14px] font-semibold text-foreground">Description</label>
                  </div>
                  {isEditingTask ? (
                    <textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-background border border-border-default rounded-lg px-4 py-3 text-[14px] text-foreground outline-none min-h-[150px] resize-none focus:ring-1 focus:ring-accent leading-[1.6]"
                      placeholder="Add a more detailed description..."
                    />
                  ) : (
                    <div className="bg-bg-subtle border border-border-default rounded-lg p-5 min-h-[120px] shadow-inner">
                      {inspectingTask.description ? (
                        <p className="text-[14px] text-foreground leading-[1.6] whitespace-pre-wrap font-normal">
                          {inspectingTask.description}
                        </p>
                      ) : (
                        <p className="text-[13px] text-foreground/50 italic">No description provided for this task.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Discussion Section */}
                <div className="space-y-6 pt-10 border-t border-border-default">
                  <div className="flex items-center gap-2 px-1">
                    <MessageSquare size={16} className="text-foreground/60" />
                    <label className="text-[14px] font-semibold text-foreground">Activity</label>
                  </div>

                  {/* Comment List */}
                  <div className="space-y-6">
                    {isFetchingComments ? (
                      <div className="flex justify-center py-6">
                        <Loading size="md" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-[13px] text-foreground/40 italic px-1">No comments yet. Start a discussion below.</p>
                    ) : (
                      <div className="space-y-8">
                        {comments.filter(c => !c.parentComment).map((comment) => (
                          <div key={comment._id} className="space-y-4">
                            {/* Main Comment */}
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-full bg-bg-subtle flex-shrink-0 flex items-center justify-center text-[11px] font-bold border border-border-default shadow-sm overflow-hidden relative mt-1 text-foreground">
                                {comment.author.avatarUrl ? (
                                  <Image src={comment.author.avatarUrl} alt={comment.author.username} fill sizes="40px" className="object-cover" />
                                ) : (
                                  comment.author.username.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 border border-border-default rounded-lg overflow-hidden bg-background shadow-sm transition-shadow hover:shadow-md">
                                  <div className="bg-bg-subtle px-4 py-2.5 border-b border-border-default flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-semibold text-foreground">{comment.author.username}</span>
                                    <span className="text-[12px] text-foreground/40">commented on {new Date(comment.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {comment.author._id === currentUserId && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setEditingCommentId(comment._id);
                                            setEditingContent(comment.content);
                                          }}
                                          className="text-[12px] font-semibold text-foreground/40 hover:text-accent transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteComment(comment._id)}
                                          className="text-[12px] font-semibold text-foreground/40 hover:text-red-500 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                      className="text-[12px] font-semibold text-foreground/40 hover:text-accent transition-colors"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                                <div className="px-4 py-3.5 text-[14px] text-foreground leading-[1.6]">
                                  {editingCommentId === comment._id ? (
                                    <div className="space-y-3">
                                      <textarea 
                                        autoFocus
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        className="w-full bg-background border border-border-default rounded-md px-3 py-2 text-[14px] text-foreground outline-none min-h-[100px] resize-none focus:ring-1 focus:ring-accent"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setEditingCommentId(null)}
                                          className="px-3 py-1.5 text-[12px] font-semibold text-foreground/60 hover:text-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateComment(comment._id)}
                                          className="px-4 py-1.5 btn btn-primary text-[12px] font-bold rounded-md"
                                        >
                                          Update
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    comment.content
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Replies */}
                            {comments.filter(r => r.parentComment === comment._id).map((reply) => (
                              <div key={reply._id} className="flex gap-4 ml-14">
                                <div className="w-8 h-8 rounded-full bg-bg-subtle flex-shrink-0 flex items-center justify-center text-[9px] font-bold border border-border-default shadow-sm overflow-hidden relative mt-1 text-foreground">
                                  {reply.author.avatarUrl ? (
                                    <Image src={reply.author.avatarUrl} alt={reply.author.username} fill sizes="32px" className="object-cover" />
                                  ) : (
                                    reply.author.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex-1 border border-border-default rounded-lg overflow-hidden bg-background shadow-sm">
                                  <div className="bg-bg-subtle/50 px-3 py-2 border-b border-border-default flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-semibold text-foreground">{reply.author.username}</span>
                                      <span className="text-[11px] text-foreground/40">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {reply.author._id === currentUserId && (
                                      <div className="flex items-center gap-3">
                                        <button 
                                          onClick={() => {
                                            setEditingCommentId(reply._id);
                                            setEditingContent(reply.content);
                                          }}
                                          className="text-[11px] font-semibold text-foreground/40 hover:text-accent transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteComment(reply._id)}
                                          className="text-[11px] font-semibold text-foreground/40 hover:text-red-500 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-3 py-2.5 text-[13px] text-foreground leading-[1.5]">
                                    {editingCommentId === reply._id ? (
                                      <div className="space-y-3">
                                        <textarea 
                                          autoFocus
                                          value={editingContent}
                                          onChange={(e) => setEditingContent(e.target.value)}
                                          className="w-full bg-background border border-border-default rounded-md px-3 py-2 text-[13px] text-foreground outline-none min-h-[80px] resize-none focus:ring-1 focus:ring-accent"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => setEditingCommentId(null)}
                                            className="px-2 py-1 text-[11px] font-semibold text-foreground/60 hover:text-foreground"
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            onClick={() => handleUpdateComment(reply._id)}
                                            className="px-3 py-1 btn btn-primary text-[11px] font-bold rounded-md"
                                          >
                                            Update
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      reply.content
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Reply Input Box */}
                            {replyingTo === comment._id && (
                              <div className="ml-14 mt-3">
                                <div className="border border-border-default rounded-lg bg-background overflow-hidden focus-within:ring-1 focus-within:ring-accent">
                                  <textarea 
                                    autoFocus
                                    value={newCommentContent}
                                    onChange={(e) => setNewCommentContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full bg-background border-none px-4 py-3 text-[13px] text-foreground outline-none min-h-[80px] resize-none"
                                  />
                                  <div className="px-3 py-2 bg-bg-subtle border-t border-border-default flex justify-end gap-2">
                                    <button 
                                      onClick={() => setReplyingTo(null)}
                                      className="px-3 py-1.5 text-[12px] font-semibold text-foreground/60 hover:text-foreground transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleCreateComment(comment._id)}
                                      disabled={!newCommentContent.trim() || isSendingComment}
                                      className="px-4 py-1.5 btn btn-primary text-[12px] font-bold rounded-md disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                                    >
                                      {isSendingComment ? <Loader2 className="animate-spin" size={12} /> : 'Post Reply'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* New Comment Box (only shown if not currently replying) */}
                  {!replyingTo && (
                    <div className="pt-4 px-1">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-bg-subtle flex-shrink-0 flex items-center justify-center text-[11px] font-bold border border-border-default shadow-sm overflow-hidden relative mt-1 text-foreground">
                          {currentUserAvatar ? (
                            <Image src={currentUserAvatar} alt="My Avatar" fill sizes="40px" className="object-cover" />
                          ) : (
                            '?'
                          )}
                        </div>
                        <div className="flex-1 border border-border-default rounded-lg bg-background overflow-hidden focus-within:ring-1 focus-within:ring-accent shadow-sm">
                          <textarea 
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-background px-4 py-3 text-[14px] text-foreground outline-none min-h-[100px] resize-none"
                          />
                          <div className="px-3 py-2 bg-bg-subtle border-t border-border-default flex justify-end">
                            <button 
                              onClick={() => handleCreateComment()}
                              disabled={!newCommentContent.trim() || isSendingComment}
                              className="px-5 py-2 btn btn-primary text-[13px] font-bold rounded-md disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                            >
                              {isSendingComment ? <Loader2 className="animate-spin" size={14} /> : 'Comment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

               {/* Modal Footer */}
               <div className="px-6 py-4 border-t border-border-default bg-bg-subtle flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentUserId = Cookies.get('user_id');
                    const isTaskCreator = inspectingTask.creator._id === currentUserId;
                    const isCurrentUserOwner = currentUserId === orgOwnerId;
                    const isTaskCreatedByOwner = inspectingTask.creator._id === orgOwnerId;
                    
                    // Logic: Owner can delete anything, Creator can delete their own, 
                    // Co-owner (isOwnerOrCreator) can delete anything EXCEPT Owner's tasks.
                    const canDelete = isCurrentUserOwner || isTaskCreator || (isOwnerOrCreator && !isTaskCreatedByOwner);
                    
                    if (!canDelete) return null;

                    return (
                      <>
                        {isEditingTask ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={handleUpdateTask}
                              disabled={isUpdatingTask || !editTitle.trim()}
                              className="px-5 py-1.5 btn btn-primary text-[13px] font-bold rounded-md disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                              {isUpdatingTask ? <Loader2 className="animate-spin" size={14} /> : 'Save Changes'}
                            </button>
                            <button 
                              onClick={() => setIsEditingTask(false)}
                              className="px-4 py-1.5 text-[13px] font-semibold text-foreground/60 hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsEditingTask(true)}
                            className="px-4 py-1.5 text-[13px] font-semibold text-foreground/40 hover:text-accent hover:bg-accent/10 rounded-md transition-colors flex items-center gap-2"
                          >
                            <Plus size={16} className="rotate-45" />
                            Edit Task
                          </button>
                        )}
                        
                        {!isEditingTask && (
                          <button 
                            onClick={() => setTaskToConfirmDelete(inspectingTask)}
                            className="px-4 py-1.5 text-[13px] font-semibold text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete Task
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <button 
                  onClick={() => setInspectingTask(null)}
                  className="px-6 py-1.5 bg-background hover:bg-bg-subtle text-foreground border border-border-default text-[13px] font-bold rounded-md transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!taskToConfirmDelete}
        onClose={() => setTaskToConfirmDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToConfirmDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        type="danger"
      />

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {isImageExpanded && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-10 cursor-zoom-out"
            onClick={() => setIsImageExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image 
                src={newTaskImage ? URL.createObjectURL(newTaskImage) : (inspectingTask?.imageUrl || '')} 
                alt="Full View"
                width={2000}
                height={2000}
                className="w-auto h-auto max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-white/5"
              />
              <button
                onClick={() => setIsImageExpanded(false)}
                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <span>Close Full View</span>
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
