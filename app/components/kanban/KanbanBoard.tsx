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
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { Loader2, Plus, X, Type, FileText, User as UserIcon, Trash2, MessageSquare, Send, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  creator: {
    username: string;
    _id: string;
  };
  assignee?: {
    username: string;
    _id: string;
  };
}

interface KanbanBoardProps {
  projectId: string;
  isOwnerOrCreator: boolean;
  members: any[];
}

export default function KanbanBoard({ projectId, isOwnerOrCreator, members }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [board, setBoard] = useState<{ columns: { id: string, title: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState<{status: string} | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [taskToConfirmDelete, setTaskToConfirmDelete] = useState<Task | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      
      // Fetch Board and Tasks in parallel
      const [boardRes, tasksRes] = await Promise.all([
        fetch(`${apiUrl}/kanban/project/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/tasks/project/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
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
  }, [fetchData]);

  const fetchComments = useCallback(async (taskId: string) => {
    setIsFetchingComments(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/comments/task/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    } else {
      setComments([]);
      setNewCommentContent('');
      setReplyingTo(null);
    }
  }, [inspectingTask, fetchComments]);

  const handleCreateComment = async (parentId?: string) => {
    if (!newCommentContent.trim() || !inspectingTask) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      }
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToConfirmDelete) return;
    const taskId = taskToConfirmDelete._id;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Task deleted');
        setTaskToConfirmDelete(null);
        setInspectingTask(null);
        refreshTasks();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('Connection error');
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

    // Basic sorting within same column or moving between columns
    if (isActiveATask && isOverAColumn) {
      const overStatus = over.data.current?.status;
      
      // Permission check for Reviewed column
      if (overStatus === 'reviewed' && !isOwnerOrCreator) {
        return;
      }

      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        tasks[activeIndex].status = overStatus;
        return arrayMove(tasks, activeIndex, activeIndex);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/tasks/${activeId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus, order: newOrder })
      });

      if (response.ok) {
        refreshTasks(); // Refresh to get precise order from server
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !showTaskForm) return;

    setIsCreatingTask(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = Cookies.get('access_token');
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          projectId: projectId,
          assigneeId: newTaskAssignee || undefined
        })
      });

      if (response.ok) {
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskAssignee('');
        setShowTaskForm(null);
        refreshTasks();
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
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden h-full pb-2">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full px-2 overflow-y-hidden">
          {board?.columns.map((col) => (
            <KanbanColumn 
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter(t => t.status === col.id)}
              onAddTask={(col.id === 'todo' && isOwnerOrCreator) ? () => setShowTaskForm({status: col.id}) : undefined}
              onDeleteTask={(task) => setTaskToConfirmDelete(task)}
              onTaskClick={setInspectingTask}
              isOwnerOrCreator={isOwnerOrCreator}
              isLocked={col.id === 'reviewed' && !isOwnerOrCreator}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72">
              <TaskCard task={activeTask} />
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
              className="relative w-full max-w-sm bg-background border border-border-default rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-subtle">
                <h3 className="font-bold flex items-center gap-2">
                  <Plus size={16} className="text-accent" />
                  Add New Task
                </h3>
                <button onClick={() => setShowTaskForm(null)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Task Title</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                      autoFocus
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2 text-zinc-400" size={14} />
                    <textarea 
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Optional details..."
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all min-h-[80px] resize-none"
                    />
                  </div>
                </div>

                {isOwnerOrCreator && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Assign To</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                      <select 
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border-default rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {members.map((member: any) => (
                          <option key={member.user._id} value={member.user._id}>
                            {member.user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

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
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Task Details</h2>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ID: {inspectingTask._id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectingTask(null)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Title Section */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Title</label>
                  <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                    {inspectingTask.title}
                  </h1>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 py-6 border-y border-border-default/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        inspectingTask.status === 'reviewed' ? 'bg-green-500' :
                        inspectingTask.status === 'done' ? 'bg-accent' :
                        inspectingTask.status === 'in_progress' ? 'bg-blue-500' : 'bg-zinc-400'
                      }`} />
                      <span className="text-sm font-semibold capitalize">{inspectingTask.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Creator</label>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold">
                        {inspectingTask.creator.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{inspectingTask.creator.username}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Assignee</label>
                    <div className="flex items-center gap-2">
                      {(inspectingTask as any).assignee ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-bold text-white">
                            {(inspectingTask as any).assignee.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{(inspectingTask as any).assignee.username}</span>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type size={14} className="text-zinc-400" />
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                  </div>
                  <div className="bg-bg-subtle border border-border-default rounded-xl p-5 min-h-[120px]">
                    {inspectingTask.description ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {inspectingTask.description}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400 italic">No description provided for this task.</p>
                    )}
                  </div>
                </div>

                {/* Discussion Section */}
                <div className="space-y-6 pt-6 border-t border-border-default/50">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-zinc-400" />
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Discussion</label>
                  </div>

                  {/* Comment List */}
                  <div className="space-y-4">
                    {isFetchingComments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-zinc-400" size={20} />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic px-1">No comments yet. Start a discussion below.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Separate flat comments into threaded structure */}
                        {comments.filter(c => !c.parentComment).map((comment) => (
                          <div key={comment._id} className="space-y-3">
                            {/* Main Comment */}
                            <div className="flex gap-3 group">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold border border-border-default shadow-sm">
                                {comment.author.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">{comment.author.username}</span>
                                  <span className="text-[10px] text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="bg-bg-subtle border border-border-default rounded-lg p-3 text-sm text-zinc-300">
                                  {comment.content}
                                </div>
                                <button 
                                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                  className="text-[10px] text-zinc-500 hover:text-accent font-bold px-1 transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>

                            {/* Replies */}
                            {comments.filter(r => r.parentComment === comment._id).map((reply) => (
                              <div key={reply._id} className="flex gap-3 ml-11">
                                <div className="p-1 text-zinc-600">
                                  <CornerDownRight size={14} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-accent border border-accent/20">
                                  {reply.author.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold">{reply.author.username}</span>
                                    <span className="text-[9px] text-zinc-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="bg-accent/5 border border-accent/10 rounded-lg p-2.5 text-[13px] text-zinc-300">
                                    {reply.content}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Reply Input */}
                            {replyingTo === comment._id && (
                              <div className="ml-11 flex gap-2">
                                <input 
                                  autoFocus
                                  value={newCommentContent}
                                  onChange={(e) => setNewCommentContent(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 bg-background border border-border-default rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none"
                                  onKeyDown={(e) => e.key === 'Enter' && handleCreateComment(comment._id)}
                                />
                                <button 
                                  onClick={() => handleCreateComment(comment._id)}
                                  className="p-2 bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* New Comment Box (only shown if not currently replying) */}
                  {!replyingTo && (
                    <div className="pt-2">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold border border-border-default shadow-sm opacity-50">
                          ?
                        </div>
                        <div className="flex-1 space-y-2">
                          <textarea 
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-bg-subtle border border-border-default rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none min-h-[80px] resize-none"
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={() => handleCreateComment()}
                              disabled={!newCommentContent.trim()}
                              className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                              <Send size={12} />
                              Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border-default bg-bg-subtle flex justify-between items-center">
                <div>
                  {(inspectingTask.creator._id === Cookies.get('user_id') || isOwnerOrCreator) && (
                    <button 
                      onClick={() => setTaskToConfirmDelete(inspectingTask)}
                      className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Task
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setInspectingTask(null)}
                  className="px-6 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
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
    </div>
  );
}
