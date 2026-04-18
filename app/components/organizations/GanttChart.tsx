'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/app/utils/api';
import { Loader2, Kanban, Calendar, Filter, ChevronRight, ChevronDown, CheckCircle2, Circle, Clock } from 'lucide-react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
    if (statusFilters.length === 0) return tasks;
    
    // Status mapping: 'reviewed' bookmark handles both 'reviewed' and 'done' statuses
    return tasks.filter(t => {
       if (statusFilters.includes('reviewed')) {
          if (t.status === 'reviewed' || t.status === 'done') return true;
       }
       return statusFilters.includes(t.status);
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
        const start = new Date(task.startDate || task.createdAt);
        const end = task.dueDate ? new Date(task.dueDate) : null;
        
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
    end.setDate(latestDate.getDate() + 5);
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

  // Standardize grid boundary to Local Midnight 00:00:00
  const toGridStart = (val: any) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  const getDayPosition = (dateVal: any) => {
    const target = new Date(dateVal);
    if (isNaN(target.getTime())) return 0;

    // Use absolute time difference for position to avoid timezone shifts
    const diffTime = target.getTime() - timeConfig.start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays;
  };

  const getTodayPosition = () => {
    const todayStr = now.toDateString();
    const idx = timeConfig.days.findIndex(d => d.toDateString() === todayStr);
    if (idx === -1) return -100; // Off screen
    
    // Calculate fractional day progress precisely
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const progress = (now.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24);
    
    return idx + progress;
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
        <Loader2 className="animate-spin text-accent" size={32} />
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
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden border border-border-default rounded-xl m-4">
      {/* Header / Timeline Labels */}
      <div className="flex border-b border-border-default bg-bg-subtle shrink-0">
        <div className="w-64 border-r border-border-default p-4 shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-foreground/40" />
            <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest">Projects & Tasks</span>
          </div>
          <div className="flex flex-col gap-2">
             {[
               { id: 'todo', label: 'To Do', icon: Circle, color: 'slate' },
               { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'blue' },
               { id: 'reviewed', label: 'Done', icon: CheckCircle2, color: 'green' }
             ].map(f => {
               // In Additive Mode, isActive means it is selected. 
               // If NONE are selected, we show all (effectively they are all active visually or neutral)
               const isSelected = statusFilters.includes(f.id);
               
               const colorMap: Record<string, string> = {
                  slate: isSelected ? 'bg-slate-500/20 border-slate-500/40 text-slate-300' : 'bg-slate-500/5 border-slate-500/10 text-slate-500 opacity-60',
                  blue: isSelected ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-500/5 border-blue-500/10 text-blue-500 opacity-60',
                  green: isSelected ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-green-500/5 border-green-500/10 text-green-500 opacity-60'
               };

               return (
                 <button 
                   key={f.id}
                   onClick={() => toggleStatusFilter(f.id)}
                   className={`flex items-center justify-between px-3 py-1.5 rounded-r-lg border-l-4 transition-all group/tab relative overflow-hidden ${colorMap[f.color]} border-t border-r border-b border-opacity-30`}
                 >
                   {/* Bookmark Ribbon Tail effect on hover */}
                   <div className={`absolute left-0 top-0 bottom-0 w-0 group-hover/tab:w-full transition-all duration-300 opacity-[0.03] pointer-events-none ${
                      f.color === 'slate' ? 'bg-slate-400' : f.color === 'blue' ? 'bg-blue-400' : 'bg-green-400'
                   }`} />
                   
                   <div className="flex items-center gap-2 z-10">
                      <f.icon size={11} className={isSelected ? 'opacity-100' : 'opacity-40'} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{f.label}</span>
                   </div>

                   {isSelected && (
                      <div className={`w-1 h-1 rounded-full z-10 ${
                         f.color === 'slate' ? 'bg-slate-400' : f.color === 'blue' ? 'bg-blue-400' : 'bg-green-400'
                      }`} />
                   )}
                 </button>
               );
             })}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-x-auto no-scrollbar">
          {/* Month Header Banner */}
          <div className="flex border-b border-border-default/30 bg-background/30">
            {timeConfig.months.map((month, idx) => (
              <div 
                key={idx} 
                className="border-r border-border-default/30 px-3 py-1.5 shrink-0"
                style={{ flex: `${month.days}` }}
              >
                <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{month.name}</span>
              </div>
            ))}
          </div>

          {/* Days Header */}
          <div className="flex flex-1">
            {timeConfig.days.map((day, idx) => {
              const isToday = day.toDateString() === now.toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div 
                  key={idx} 
                  className={`flex-1 min-w-[40px] border-r border-border-default/30 py-2.5 flex flex-col items-center justify-center relative ${isToday ? 'bg-accent/5' : isWeekend ? 'bg-bg-subtle/30' : ''}`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-accent' : isWeekend ? 'text-foreground/20' : 'text-foreground/30'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                  </span>
                  <span className={`text-[12px] font-extrabold ${isToday ? 'text-accent' : isWeekend ? 'text-foreground/30' : 'text-foreground/60'}`}>
                    {day.getDate()}
                  </span>
                  {isToday && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Timeline Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="flex min-h-full">
          {/* Left Column (Task Names) */}
          <div className="w-64 border-r border-border-default bg-background/50 shrink-0 z-10 divide-y divide-border-default/50">
            {Object.entries(groupedTasks).map(([pid, group]) => {
              const isProjectView = !!projectId;
              
              return (
                <div key={pid} className="contents">
                  {/* Show header ONLY in Org View (when projectId is null) */}
                  {!isProjectView && (
                    <div 
                      onClick={() => toggleProject(pid)}
                      className="bg-bg-subtle/80 backdrop-blur-sm sticky top-0 px-4 py-3 h-12 flex items-center gap-3 z-30 border-b border-border-default/50 cursor-pointer group/header hover:bg-bg-subtle transition-colors"
                    >
                      <div className={`transition-transform duration-200 ${expandedProjects[pid] ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown size={14} className="text-foreground/40 group-hover/header:text-accent" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate uppercase tracking-widest">{group.name || 'Untitled Project'}</span>
                      <div className="flex-1" />
                      <span className="text-[10px] font-bold text-foreground/20 italic">{group.tasks.length}</span>
                    </div>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {(expandedProjects[pid] || isProjectView) && (
                      <motion.div 
                        initial={isProjectView ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-background/20 divide-y divide-border-default/30 overflow-hidden"
                      >
                        {group.tasks.map(task => {
                          const durationInDays = task.startDate && task.dueDate 
                            ? Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                            : 0;

                          return (
                            <div key={task._id} className="px-0 py-0 h-10 flex items-center justify-between group/row hover:bg-bg-subtle/30 transition-colors">
                                 <div className="h-10 w-full flex items-center justify-between px-6 border-t border-border-default/10 bg-bg-surface/30">
                                   <span className="text-[10px] font-semibold text-foreground/80 truncate pr-4">
                                     {task.title}
                                   </span>
                                   {durationInDays > 0 && (
                                     <span className="text-[8px] text-foreground/30 font-bold uppercase tracking-tighter shrink-0">{durationInDays} DAYS</span>
                                   )}
                                 </div>
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

          {/* Right Column (The Grid & Bars) */}
          <div className="flex-1 relative bg-grid-pinstripe">
            {/* Weekend Shading columns */}
            <div className="absolute inset-0 flex pointer-events-none">
               {timeConfig.days.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`flex-1 min-w-[40px] border-r border-border-default/5 ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-bg-subtle/10' : ''}`}
                  />
               ))}
            </div>

            {/* Main Grid Content */}
            <div className="divide-y divide-border-default/50">
               {Object.entries(groupedTasks).map(([pid, group]) => {
                const isProjectView = !!projectId;

                return (
                  <div key={`${pid}-grid`} className="contents">
                    {!isProjectView && (
                      <div 
                        onClick={() => toggleProject(pid)}
                        className="h-12 bg-bg-subtle/20 border-b border-border-default/50 sticky top-0 z-20 cursor-pointer" 
                      />
                    )}
                    <AnimatePresence initial={false}>
                      {(expandedProjects[pid] || isProjectView) && (
                        <motion.div 
                          initial={isProjectView ? false : { height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="divide-y divide-border-default/30 overflow-hidden"
                        >
                        {group.tasks.map((task, taskIdx) => {
                           // --- 1. Task Duration Formula ---
                           const startDate = new Date(task.startDate || task.createdAt);
                           const endDate = new Date(task.dueDate || (task.status === 'reviewed' ? task.updatedAt : now));
                           
                           // --- 2. Task Start Position (Offset from Project Start) ---
                           const startPos = getDayPosition(startDate);
                           
                           // --- 3 & 4. Gantt Bar Length & Position ---
                           let width = getDayPosition(endDate) - startPos;
                           if (width < 1.0) width = 1.0; // Min visibility

                           const progress = getStatusProgress(task.status);
                           const isAtBottom = taskIdx > group.tasks.length - 3;

                           return (
                             <div key={task._id} className="h-10 w-full flex items-center px-[0.5%] relative border-t border-border-default/10">
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`h-6 rounded shadow-lg border group/bar relative transition-all hover:scale-[1.01] hover:brightness-110 hover:z-[200] flex items-center pr-3 overflow-hidden bg-[#21262d] ${
                                 task.status === 'reviewed' ? 'border-[#2ea043]' :
                                 task.status === 'done' ? 'border-[#2ea043]/60' :
                                 task.priority === 'urgent' ? 'border-[#f85149]' :
                                 'border-[#30363d]'
                               }`}
                                style={{ 
                                 width: `${(width / timeConfig.days.length) * 100}%`,
                                 marginLeft: `${(startPos / timeConfig.days.length) * 100}%`,
                               }}
                             >
                                {/* --- 5. Progress Fill Background --- */}
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ${
                                    task.status === 'reviewed' || task.status === 'done' ? 'bg-[#238636]' :
                                    task.priority === 'urgent' ? 'bg-[#da3633]' :
                                    'bg-[#1f6feb]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />

                                <span className="text-[10px] font-bold truncate whitespace-nowrap z-10 pl-2 pr-4 relative text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                  {task.title}
                                </span>

                                 {/* Tooltip on Hover */}
                                 <div className={`absolute pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-all duration-150 z-[100] bg-[#0d1117] border border-[#30363d] p-3 rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)] min-w-[220px] left-0 ${
                                   isAtBottom ? 'bottom-full mb-2' : 'top-full mt-2'
                                 }`}>
                                   <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-4">
                                         <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Task Details</span>
                                         <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                            task.priority === 'urgent' ? 'bg-red-500 text-white' :
                                            task.priority === 'high' ? 'bg-yellow-500 text-black' :
                                            'bg-bg-subtle text-foreground/40'
                                         }`}>{task.priority || 'Low'}</div>
                                      </div>
                                      <h4 className="text-sm font-bold text-foreground leading-tight">{task.title}</h4>
                                      <div className="pt-2 border-t border-border-default/50 flex flex-col gap-1.5">
                                         <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-foreground/40">Status:</span>
                                            <div className="flex items-center gap-1.5">
                                               <div className="w-12 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                                                  <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                                               </div>
                                               <span className="text-foreground font-bold uppercase text-[9px] tracking-tight text-accent">
                                                  {task.status.replace('_', ' ')}
                                               </span>
                                            </div>
                                         </div>
                                         <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-foreground/40">Duration:</span>
                                            <span className="text-foreground font-semibold">
                                               {task.startDate && task.dueDate
                                                  ? `${Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days`
                                                  : 'TBD'}
                                            </span>
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
