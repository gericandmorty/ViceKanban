'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '@/app/utils/api';
import { Loader2, Kanban, Calendar, Filter, ChevronRight, ChevronDown, CheckCircle2, Circle, Clock } from 'lucide-react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Loading from '@/app/components/ui/Loading';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    _id: string;
    name: string;
  };
  assignee?: {
    username: string;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface GanttChartProps {
  orgId: string;
  projectId?: string | null;
}

export default function GanttChart({ orgId, projectId }: GanttChartProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [statusFilters, setStatusFilters] = useState<string[]>([]); // Empty means "Show All"
  const [now, setNow] = useState(new Date());

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const COLUMN_WIDTH = 100; 
  const ROW_HEIGHT = 40; // More spacious rows

  // Update current time every minute to keep the 'Today' line accurate without refreshes
  useEffect(() => {
    // Force a setNow immediately on mount to handle hydration differences
    setNow(new Date());
    
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const endpoint = projectId 
          ? `/tasks/project/${projectId}` 
          : `/tasks/org/${orgId}`;
        
        const response = await apiFetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
          
          // Auto-expand projects in overall view
          if (!projectId) {
            const initialExpanded: Record<string, boolean> = {};
            data.forEach((t: Task) => {
              initialExpanded[t.project._id] = true;
            });
            setExpandedProjects(initialExpanded);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks for Gantt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [orgId, projectId]);

  const toggleProject = (pid: string) => {
    setExpandedProjects(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  // Filter and Group tasks by project
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilters.length > 0) {
      result = tasks.filter(t => {
        if (statusFilters.includes('reviewed')) {
           if (t.status === 'reviewed' || t.status === 'done') return true;
        }
        return statusFilters.includes(t.status);
      });
    }

    // Sort by start date to create a logical cascade (Accuracy improvement)
    return [...result].sort((a, b) => {
      const aStart = new Date(a.startDate || a.createdAt).getTime();
      const bStart = new Date(b.startDate || b.createdAt).getTime();
      return aStart - bStart;
    });
  }, [tasks, statusFilters]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { name: string, tasks: Task[] }> = {};
    filteredTasks.forEach(task => {
      const pid = task.project._id;
      if (!groups[pid]) groups[pid] = { name: task.project.name, tasks: [] };
      groups[pid].tasks.push(task);
    });
    return groups;
  }, [filteredTasks]);

  // Calculate dynamic time range based on task deadlines
  const timeConfig = useMemo(() => {
    const mountNow = new Date();
    
    // Find absolute boundaries of the project
    let earliestDate = new Date(mountNow);
    earliestDate.setDate(mountNow.getDate() - 5); // Default 5 days back
    
    let latestDate = new Date(mountNow);
    latestDate.setDate(mountNow.getDate() + 14); // Default 14 days forward
    
    if (filteredTasks.length > 0) {
      filteredTasks.forEach(task => {
        // Normalize to the start of the day to avoid time-of-day offsets
        const taskRawStart = new Date(task.startDate || task.createdAt);
        const start = new Date(taskRawStart.getFullYear(), taskRawStart.getMonth(), taskRawStart.getDate(), 0, 0, 0, 0);
        
        const end = task.dueDate ? new Date(task.dueDate) : null;
        if (end) end.setHours(0, 0, 0, 0);
        
        if (start < earliestDate) earliestDate = new Date(start);
        if (end && end > latestDate) latestDate = new Date(end);
      });
    }
    
    // 1. Normalize start to the BEGINNING of the day (Local Machine Time)
    const start = new Date(earliestDate);
    start.setDate(earliestDate.getDate() - 2);
    start.setHours(0, 0, 0, 0); 
    
    // 2. Normalize end to the END of the day (Local Machine Time)
    const end = new Date(latestDate);
    end.setDate(latestDate.getDate() + 7); // Extended slightly for better view
    end.setHours(23, 59, 59, 999);
    
    // Exact dates for the window
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Group days by month for the header
    const months: { name: string, days: number, startIdx: number }[] = [];
    days.forEach((day, idx) => {
       const monthName = day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
       if (months.length === 0 || months[months.length - 1].name !== monthName) {
          months.push({ name: monthName, days: 1, startIdx: idx });
       } else {
          months[months.length - 1].days++;
       }
    });
    
    return { start, end, days, months };
  }, [filteredTasks]);

  // 4. Performance Indexing - O(1) Lookups for Tooltip Positioning
  const visibleTasksInfo = useMemo(() => {
    const isProjectView = !!projectId;
    const list = Object.entries(groupedTasks)
      .filter(([id]) => expandedProjects[id] || isProjectView)
      .flatMap(([_, g]) => g.tasks);
    
    // Map for O(1) index lookup
    const indexMap = new Map();
    list.forEach((t, i) => indexMap.set(t._id, i));
    
    return { list, indexMap, total: list.length };
  }, [groupedTasks, expandedProjects, projectId]);

  const getDayPosition = (dateVal: any) => {
    if (!dateVal) return 0;
    const d = typeof dateVal === 'object' ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return 0;
    
    // PIXEL POSITION: Calculate exact pixel offset based on COLUMN_WIDTH
    const diffTime = d.getTime() - timeConfig.start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * COLUMN_WIDTH;
  };

  const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // --- 5. Progress Based on Status ---
  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'todo': return 0;
      case 'in_progress': return 50;
      case 'done': return 80;
      case 'reviewed': return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <Loading size="lg" message="Loading Gantt Chart..." />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
        <Calendar size={48} className="text-foreground/20" />
        <div className="max-w-xs">
          <p className="text-sm font-semibold text-foreground">No tasks to visualize</p>
          <p className="text-xs text-foreground/40 mt-1">Create tasks with start and due dates to see them on the timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background border border-border-default rounded-xl overflow-hidden shadow-sm m-1">
      {/* Scrollable Viewport */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden relative">
        
        {/* Sticky Header Wrapper (Horizontal syncs with grid) */}
        <div 
          className="flex-shrink-0 bg-bg-subtle border-b border-border-default overflow-hidden z-30"
          style={{ paddingLeft: '240px' }} 
        >
          <div ref={headerRef} className="overflow-x-auto no-scrollbar">
            <div 
              style={{ width: `${timeConfig.days.length * COLUMN_WIDTH}px` }}
              className="relative py-2"
            >
              {/* Months Header */}
              <div className="flex mb-1">
                {timeConfig.months.map((month, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center px-4 border-l border-border-default/50"
                    style={{ width: `${month.days * COLUMN_WIDTH}px` }}
                  >
                    <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{month.name}</span>
                  </div>
                ))}
              </div>

              {/* Days Header */}
              <div className="flex">
                {timeConfig.days.map((day, idx) => {
                  const isToday = day.toDateString() === now.toDateString();
                  return (
                    <div 
                      key={idx}
                      className={`flex flex-col items-center justify-center border-l border-border-default/30 ${isToday ? 'bg-accent/5' : ''}`}
                      style={{ width: `${COLUMN_WIDTH}px` }}
                    >
                      <span className={`text-[11px] font-medium ${isToday ? 'text-accent font-bold' : 'text-foreground/40'}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                      </span>
                      <span className={`text-[16px] font-bold tabular-nums ${isToday ? 'text-accent' : 'text-foreground'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Projects & Tasks Sidebar (Left) */}
          <div className="w-[240px] flex-shrink-0 border-r border-border-default bg-background z-20 flex flex-col pt-[10px] shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
            <div className="px-5 py-3 flex items-center gap-2 mb-4">
              <Filter size={14} className="text-foreground/40" />
              <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Projects & Tasks</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
               {Object.entries(groupedTasks).map(([pid, group]) => {
                 const isProjectView = !!projectId;
                 return (
                   <div key={pid} className="mb-2">
                     {!isProjectView && (
                       <button 
                         onClick={() => toggleProject(pid)}
                         className="w-full px-5 py-2.5 flex items-center justify-between group hover:bg-bg-subtle transition-colors"
                       >
                         <div className="flex items-center gap-2.5">
                            <ChevronDown 
                              size={14} 
                              className={`text-foreground/30 transition-transform duration-200 ${expandedProjects[pid] ? 'rotate-0 text-accent' : '-rotate-90'}`} 
                            />
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span className="text-[11px] font-bold text-foreground group-hover:text-accent uppercase tracking-wider">{group.name}</span>
                         </div>
                         <span className="text-[10px] font-bold text-foreground/20 tabular-nums">{group.tasks.length}</span>
                       </button>
                     )}
                     
                     <AnimatePresence>
                       {(expandedProjects[pid] || isProjectView) && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="overflow-hidden"
                         >
                           {group.tasks.map((task) => (
                             <div 
                               key={task._id} 
                               className="h-[40px] px-4 pl-12 flex items-center justify-between border-b border-border-default/30 group hover:bg-bg-subtle/40 transition-colors"
                             >
                                <div className="flex items-center gap-2.5 min-w-0">
                                   {task.status === 'done' || task.status === 'reviewed' ? 
                                     <CheckCircle2 size={13} className="text-success shrink-0" /> : 
                                     <Circle size={13} className="text-foreground/30 shrink-0" />}
                                   <span className="text-[11px] text-foreground font-medium truncate py-1">
                                      {task.title}
                                   </span>
                                </div>
                             </div>
                           ))}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Grid Area (Right - Infinite scroll syncs with header) */}
          <div 
            ref={gridRef}
            onScroll={syncScroll}
            className="flex-1 overflow-auto custom-scrollbar relative"
          >
            {/* Horizontal Timeline Background (Grid) */}
            <div 
              className="absolute inset-0 z-0 pointer-events-none"
              style={{ width: `${timeConfig.days.length * COLUMN_WIDTH}px` }}
            >
              <div className="flex h-full">
                {timeConfig.days.map((_, idx) => (
                  <div 
                    key={idx}
                    className="h-full border-l border-border-default/20 transition-colors"
                    style={{ width: `${COLUMN_WIDTH}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Main Grid Content */}
            <div className="divide-y divide-border-default/20 relative z-10">
               {Object.entries(groupedTasks).map(([pid, group]) => {
                 const isProjectView = !!projectId;

                 return (
                   <div key={`${pid}-grid`} className="contents">
                     {!isProjectView && (
                       <div 
                         onClick={() => toggleProject(pid)}
                         className="h-12 bg-bg-subtle/10 border-b border-border-default/50 sticky top-0 z-20 cursor-pointer" 
                       />
                     )}
                     <AnimatePresence initial={false}>
                       {(expandedProjects[pid] || isProjectView) && (
                         <motion.div 
                           initial={isProjectView ? false : { height: 0 }}
                           animate={{ height: 'auto' }}
                           exit={{ height: 0 }}
                           className="divide-y divide-border-default/10 overflow-visible"
                         >
                         {group.tasks.map((task) => {
                           // OPTIMIZED LOOKUP: O(1) instead of O(N^2)
                           const globalIdx = visibleTasksInfo.indexMap.get(task._id);
                           const totalVisible = visibleTasksInfo.total;

                           const startDate = new Date(task.startDate || task.createdAt);
                           const endDate = task.dueDate ? new Date(task.dueDate) : now;
                           
                           const startPos = getDayPosition(startDate);
                           const endPos = getDayPosition(endDate);
                           
                           let width = endPos - startPos;
                           // Minimum width for very short tasks to remain visible
                           if (width < 0.05) width = 0.05; 

                           const progress = getStatusProgress(task.status);

                           // High Precision Duration for tooltip
                           const diffMs = endDate.getTime() - startDate.getTime();
                           const dDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                           const dHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                           const dMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                           
                           const durationStr = `${dDays > 0 ? `${dDays}d ` : ''}${dHrs > 0 ? `${dHrs}h ` : ''}${dDays === 0 && dHrs === 0 ? `${dMins}m` : ''}`.trim();
                           
                           // PRO FIX: More aggressive thresholds for readability
                           const isMilestone = width < 12 && task.startDate && task.dueDate; 

                           return (
                             <div key={task._id} className="h-[40px] w-full flex items-center relative border-t border-border-default/10">
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`h-5 rounded-md shadow-sm border group/bar relative transition-all hover:scale-[1.01] hover:brightness-110 hover:z-[200] flex items-center overflow-visible ${
                                 task.status === 'reviewed' || task.status === 'done' ? 'bg-success/20 border-success/40' :
                                 task.priority === 'urgent' ? 'bg-red-500/20 border-red-500/40' :
                                 'bg-accent/20 border-accent/40'
                               } ${isMilestone ? 'aspect-square !w-3.5 !h-3.5 !rounded-none rotate-45 ml-[2px] !bg-accent !border-background/20' : ''}`}
                                style={{ 
                                 width: isMilestone ? undefined : `${Math.max(width, 14)}px`,
                                 left: `${startPos}px`,
                               }}
                             >
                                {!isMilestone ? (
                                  <>
                                    {/* Progress Fill */}
                                    <div 
                                      className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 rounded-l-[5px] ${
                                        task.status === 'reviewed' || task.status === 'done' ? 'bg-success' :
                                        task.priority === 'urgent' ? 'bg-red-500' :
                                        'bg-accent'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                    {/* ALWAYS OUTSIDE LABEL - High contrast text */}
                                    <span className="absolute left-[calc(100%+16px)] text-[11px] font-semibold text-foreground/80 dark:text-foreground/90 whitespace-nowrap z-10 transition-colors group-hover/bar:text-accent drop-shadow-sm">
                                      {task.title}
                                    </span>
                                  </>
                                ) : (
                                  /* Milestone Label (Always Outside) */
                                  <span className="absolute left-[calc(100%+20px)] text-[10px] font-bold text-accent whitespace-nowrap rotate-[-45deg] origin-left group-hover/bar:text-foreground transition-colors">
                                    {task.title}
                                  </span>
                                )}

                                 {/* Ultra-Compact Tooltip - Dynamically Aligned to avoid edges */}
                                 <div className={`absolute pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-all duration-150 z-[300] bg-background border border-border-default p-2.5 rounded-md shadow-2xl min-w-[220px] left-[calc(100%+160px)] ${
                                   globalIdx !== undefined && globalIdx < 4 ? 'top-0' : 
                                   globalIdx !== undefined && globalIdx > totalVisible - 4 ? 'bottom-0' : 
                                   'top-1/2 -translate-y-1/2'
                                 }`}>
                                   <div className="space-y-1.5">
                                      <div className="flex items-center justify-between border-b border-border-default pb-1.5 mb-1.5">
                                         <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Metadata</span>
                                         <div className="flex gap-1.5">
                                           <div className={`px-1 py-0.5 rounded-[2px] text-[8px] font-bold uppercase ${
                                              task.priority === 'urgent' ? 'bg-red-500/20 text-red-500' : 'bg-bg-subtle text-foreground/40'
                                           }`}>{task.priority || 'Low'}</div>
                                           <div className="px-1 py-0.5 rounded-[2px] bg-success/20 text-success text-[8px] font-bold uppercase">{task.status.replace('_', ' ')}</div>
                                         </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                        <span className="text-foreground/40">Started:</span>
                                        <span className="text-foreground text-right font-mono">{task.startDate || task.createdAt ? new Date(task.startDate || task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                        <span className="text-foreground/40">Due:</span>
                                        <span className="text-foreground text-right font-mono">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                        <div className="col-span-2 border-t border-border-default mt-1 pt-1 flex justify-between">
                                          <span className="text-foreground/40 text-[9px] uppercase tracking-wider">Duration:</span>
                                          <span className="text-accent font-bold">{durationStr}</span>
                                        </div>
                                      </div>
                                   </div>
                                 </div>
                              </motion.div>
                            </div>
                           );
                         })}
                        </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
