'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiFetch } from '@/app/utils/api';
import { Loader2, Calendar, ChevronDown, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Loading from '@/app/components/ui/Loading';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  project: { _id: string; name: string };
  assignee?: { username: string; avatarUrl?: string };
}

interface GanttChartProps {
  orgId: string;
  projectId?: string | null;
  projectName?: string | null;
  orgName?: string | null;
}

interface Popover {
  task: Task;
  x: number; // screen x
  y: number; // screen y
}

const STATUS: Record<string, { label: string; color: string; barBg: string; barBorder: string; dot: string; fill: string; pct: number }> = {
  todo:        { label: 'To Do',       color: 'text-zinc-400',    barBg: 'bg-zinc-700/60',    barBorder: 'border-zinc-600/50',    dot: 'bg-zinc-500',    fill: 'bg-zinc-500',    pct: 0   },
  in_progress: { label: 'In Progress', color: 'text-blue-400',    barBg: 'bg-blue-500/30',    barBorder: 'border-blue-400/60',    dot: 'bg-blue-400',    fill: 'bg-blue-400',    pct: 50  },
  done:        { label: 'Done',        color: 'text-emerald-400', barBg: 'bg-emerald-500/30', barBorder: 'border-emerald-400/60', dot: 'bg-emerald-400', fill: 'bg-emerald-400', pct: 80  },
  reviewed:    { label: 'Reviewed',    color: 'text-purple-400',  barBg: 'bg-purple-500/30',  barBorder: 'border-purple-400/60',  dot: 'bg-purple-400',  fill: 'bg-purple-400',  pct: 100 },
};

const SIDEBAR_W = 260;
const COL_W     = 52;
const ROW_H     = 48;
const PROJ_H    = 40;

export default function GanttChart({ orgId, projectId, projectName: projectNameProp, orgName }: GanttChartProps) {
  const [tasks,            setTasks]            = useState<Task[]>([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [statusFilters,    setStatusFilters]    = useState<string[]>([]);
  const [now,              setNow]              = useState(new Date());
  const [isExporting,      setIsExporting]      = useState(false);
  const [popover,          setPopover]          = useState<Popover | null>(null);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (popover && !target.closest('[data-popover]') && !target.closest('[data-bar]')) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [popover]);

  // Close popover on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setPopover(null);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(projectId ? `/tasks/project/${projectId}` : `/tasks/org/${orgId}`);
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          if (!projectId) {
            const exp: Record<string, boolean> = {};
            data.forEach((t: Task) => { exp[t.project._id] = true; });
            setExpandedProjects(exp);
          }
        }
      } finally { setIsLoading(false); }
    })();
  }, [orgId, projectId]);

  const toggle       = (pid: string) => setExpandedProjects(p => ({ ...p, [pid]: !p[pid] }));
  const toggleFilter = (s: string)   => setStatusFilters(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const filteredTasks = useMemo(() => {
    const base = statusFilters.length === 0 ? tasks : tasks.filter(t => {
      if (statusFilters.includes('reviewed') && (t.status === 'reviewed' || t.status === 'done')) return true;
      return statusFilters.includes(t.status);
    });
    return [...base].sort((a, b) => new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime());
  }, [tasks, statusFilters]);

  const grouped = useMemo(() => {
    const g: Record<string, { name: string; tasks: Task[] }> = {};
    filteredTasks.forEach(t => {
      if (!g[t.project._id]) g[t.project._id] = { name: t.project.name, tasks: [] };
      g[t.project._id].tasks.push(t);
    });
    return g;
  }, [filteredTasks]);

  const timeConfig = useMemo(() => {
    const base = new Date();
    let earliest = new Date(base); earliest.setDate(base.getDate() - 5);
    let latest   = new Date(base); latest.setDate(base.getDate() + 14);

    filteredTasks.forEach(t => {
      const s = new Date(t.startDate || t.createdAt); s.setHours(0,0,0,0);
      const e = t.dueDate ? new Date(t.dueDate) : null; if (e) e.setHours(0,0,0,0);
      if (s < earliest) earliest = new Date(s);
      if (e && e > latest) latest = new Date(e);
    });

    const start = new Date(earliest); start.setDate(earliest.getDate() - 3); start.setHours(0,0,0,0);
    const end   = new Date(latest);   end.setDate(latest.getDate() + 10);    end.setHours(23,59,59,999);

    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

    const months: { name: string; days: number }[] = [];
    days.forEach(d => {
      const mn = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!months.length || months.at(-1)!.name !== mn) months.push({ name: mn, days: 1 });
      else months.at(-1)!.days++;
    });

    return { start, days, months };
  }, [filteredTasks]);

  const dayX = useCallback((val: any): number => {
    if (!val) return 0;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return 0;
    return ((d.getTime() - timeConfig.start.getTime()) / 86400000) * COL_W;
  }, [timeConfig.start]);

  const handleBarClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    // Position popover relative to container using client coords within it
    setPopover({
      task,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleExport = useCallback(async () => {
    if (isExporting || !filteredTasks.length) return;
    setIsExporting(true);
    const tid = toast.loading('Generating PDF…');
    try {
      const { exportGanttToPDF } = await import('@/app/utils/ganttExport');
      const pName = projectId
        ? (projectNameProp ?? tasks.find(t => t.project._id === projectId)?.project.name ?? 'Project')
        : (orgName ?? 'All Projects');
      await exportGanttToPDF(filteredTasks, pName);
      toast.success('PDF exported!', { id: tid });
    } catch { toast.error('Export failed.', { id: tid }); }
    finally { setIsExporting(false); }
  }, [isExporting, filteredTasks, tasks, projectId, projectNameProp, orgName]);

  if (isLoading) return <div className="flex-1 flex items-center justify-center p-20"><Loading size="lg" message="Loading Gantt Chart..." /></div>;
  if (!tasks.length) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-3">
      <Calendar size={40} className="text-foreground/20" />
      <p className="text-sm font-semibold text-foreground">No tasks to visualize</p>
      <p className="text-xs text-foreground/40">Create tasks with start and due dates to see them here.</p>
    </div>
  );

  const totalGridW = timeConfig.days.length * COL_W;
  const totalW     = SIDEBAR_W + totalGridW;
  const isProjView = !!projectId;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-full min-h-0 bg-background border border-border-default rounded-xl overflow-hidden shadow-sm relative">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border-default bg-bg-subtle">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Filter</span>
          {Object.entries(STATUS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                statusFilters.includes(key)
                  ? `${cfg.barBg} ${cfg.barBorder} ${cfg.color}`
                  : 'bg-transparent border-border-default text-foreground/40 hover:text-foreground/70 hover:border-foreground/30'
              }`}
            >{cfg.label}</button>
          ))}
          {statusFilters.length > 0 && (
            <button onClick={() => setStatusFilters([])} className="text-[10px] text-foreground/30 hover:text-foreground/60 underline">Clear</button>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || !filteredTasks.length}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
            isExporting ? 'opacity-50 cursor-not-allowed bg-bg-subtle border-border-default text-foreground/40'
                        : 'bg-accent text-white border-accent hover:brightness-110 shadow-sm active:scale-95'
          }`}
        >
          {isExporting ? <><Loader2 size={13} className="animate-spin" /><span>Exporting…</span></> : <><Download size={13} /><span>Export PDF</span></>}
        </button>
      </div>

      {/* ── Single scroll container ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar">
        <div style={{ minWidth: totalW }}>

          {/* ── Sticky header ── */}
          <div className="sticky top-0 z-30 flex border-b border-border-default bg-bg-subtle" style={{ minWidth: totalW }}>
            {/* Sidebar header cell — sticky LEFT */}
            <div
              className="flex-shrink-0 sticky left-0 z-40 bg-bg-subtle border-r border-border-default flex items-end px-4 pb-2 pt-2"
              style={{ width: SIDEBAR_W }}
            >
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Tasks</span>
            </div>

            {/* Timeline header */}
            <div style={{ width: totalGridW }}>
              <div className="flex">
                {timeConfig.months.map((m, i) => (
                  <div key={i} className="flex items-end px-3 pt-2 pb-1 border-l border-border-default/20" style={{ width: m.days * COL_W }}>
                    <span className="text-[10px] font-semibold text-foreground/35 tracking-widest uppercase whitespace-nowrap">{m.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex">
                {timeConfig.days.map((day, i) => {
                  const isToday   = day.toDateString() === now.toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center justify-center py-1.5 border-l ${
                        isToday   ? 'border-accent/30 bg-accent/10' :
                        isWeekend ? 'border-border-default/15 bg-bg-subtle/50' : 'border-border-default/15'
                      }`}
                      style={{ width: COL_W, minWidth: COL_W }}
                    >
                      <span className={`text-[8px] font-semibold uppercase ${isToday ? 'text-accent/80' : 'text-foreground/25'}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                      </span>
                      {isToday ? (
                        <span className="w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-white tabular-nums mt-0.5">
                          {day.getDate()}
                        </span>
                      ) : (
                        <span className={`text-[13px] font-semibold tabular-nums mt-0.5 ${isWeekend ? 'text-foreground/25' : 'text-foreground/55'}`}>
                          {day.getDate()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Body rows ── */}
          <div className="relative">
            {/* Column stripes */}
            <div className="absolute inset-0 flex pointer-events-none z-0" style={{ left: SIDEBAR_W }}>
              {timeConfig.days.map((day, i) => {
                const isToday   = day.toDateString() === now.toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`h-full border-l ${
                      isToday   ? 'border-accent/20 bg-accent/[0.06]' :
                      isWeekend ? 'border-border-default/15 bg-bg-subtle/20' : 'border-border-default/10'
                    }`}
                    style={{ width: COL_W, minWidth: COL_W }}
                  />
                );
              })}
            </div>

            {/* Groups */}
            {Object.entries(grouped).map(([pid, group]) => (
              <div key={pid}>
                {/* Project header row */}
                {!isProjView && (
                  <div
                    className="flex items-stretch border-b border-border-default/30 bg-bg-subtle/20 hover:bg-bg-subtle/40 cursor-pointer transition-colors"
                    style={{ height: PROJ_H }}
                    onClick={() => toggle(pid)}
                  >
                    <div
                      className="flex-shrink-0 sticky left-0 z-20 bg-bg-subtle/90 flex items-center gap-2 px-4 border-r border-border-default/30"
                      style={{ width: SIDEBAR_W }}
                    >
                      <ChevronDown size={12} className={`text-foreground/40 transition-transform shrink-0 ${expandedProjects[pid] ? '' : '-rotate-90'}`} />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-wide truncate flex-1">{group.name}</span>
                      <span className="text-[10px] font-bold text-foreground/25 tabular-nums shrink-0">{group.tasks.length}</span>
                    </div>
                    <div className="flex-1 relative z-10" />
                  </div>
                )}

                {/* Task rows — use overflow: clip so sticky still works inside animation */}
                <AnimatePresence initial={false}>
                  {(expandedProjects[pid] || isProjView) && (
                    <motion.div
                      initial={isProjView ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'clip' }}
                    >
                      {group.tasks.map(task => {
                        const cfg    = STATUS[task.status] ?? STATUS.todo;
                        const sDate  = new Date(task.startDate || task.createdAt);
                        const eDate  = task.dueDate ? new Date(task.dueDate) : now;
                        const left   = dayX(sDate);
                        const wPx    = Math.max(dayX(eDate) - left, 6);
                        const isActive = popover?.task._id === task._id;

                        return (
                          <div
                            key={task._id}
                            className="flex items-stretch border-b border-border-default/15"
                            style={{ height: ROW_H }}
                          >
                            {/* Sidebar cell — sticky left */}
                            <div
                              onClick={e => handleBarClick(e, task)}
                              className="group/task flex-shrink-0 sticky left-0 z-20 bg-background flex items-center gap-2.5 border-r border-border-default/20 hover:bg-bg-subtle/50 transition-colors cursor-pointer"
                              style={{ width: SIDEBAR_W, paddingLeft: isProjView ? 16 : 28, paddingRight: 12 }}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              <span className="text-[12px] text-foreground/80 font-medium truncate flex-1 leading-snug">{task.title}</span>
                              <span className="text-[9px] font-bold text-foreground/30 opacity-0 group-hover/task:opacity-100 transition-opacity uppercase tracking-wider shrink-0 mr-1">View Details</span>
                              {task.assignee?.avatarUrl ? (
                                <div className="w-5 h-5 rounded-full overflow-hidden relative border border-border-default shrink-0">
                                  <Image src={task.assignee.avatarUrl} alt={task.assignee.username} fill sizes="20px" className="object-cover" />
                                </div>
                              ) : task.assignee ? (
                                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent shrink-0">
                                  {task.assignee.username.charAt(0).toUpperCase()}
                                </div>
                              ) : null}
                            </div>

                            {/* Grid cell */}
                            <div className="flex-1 relative z-10 flex items-center pointer-events-none">
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-6 rounded border transition-all ${cfg.barBg} ${cfg.barBorder} ${
                                  isActive ? 'ring-2 ring-offset-1 ring-offset-background ring-accent/60 brightness-110' : ''
                                }`}
                                style={{ left, width: wPx }}
                              >
                                {/* Progress fill */}
                                <div className={`absolute inset-y-0 left-0 rounded-l ${cfg.fill} opacity-40`} style={{ width: `${cfg.pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Click Popover — fixed within component container ── */}
      <AnimatePresence>
        {popover && (() => {
          const task  = popover.task;
          const cfg   = STATUS[task.status] ?? STATUS.todo;
          const sDate = new Date(task.startDate || task.createdAt);
          const eDate = task.dueDate ? new Date(task.dueDate) : now;
          const diffMs = eDate.getTime() - sDate.getTime();
          const dDays  = Math.floor(diffMs / 86400000);
          const dHrs   = Math.floor((diffMs % 86400000) / 3600000);
          const dur    = dDays > 0 ? `${dDays}d` : dHrs > 0 ? `${dHrs}h` : '< 1h';
          const fmt    = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          // Keep popover inside bounds (280px wide, ~160px tall)
          const PW = 280, PH = 170;
          const container = containerRef.current;
          const cw = container?.offsetWidth ?? 800;
          const ch = container?.offsetHeight ?? 600;
          let px = popover.x + 12;
          let py = popover.y + 12;
          if (px + PW > cw - 8) px = popover.x - PW - 12;
          if (py + PH > ch - 8) py = popover.y - PH - 12;

          return (
            <motion.div
              data-popover
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-[600] bg-background border border-border-default rounded-xl shadow-2xl overflow-hidden"
              style={{ left: px, top: py, width: PW, pointerEvents: 'auto' }}
            >
              {/* Header */}
              <div className={`px-4 py-3 flex items-start justify-between gap-2 border-b border-border-default/40 ${cfg.barBg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <p className="text-[12px] font-bold text-foreground leading-snug truncate">{task.title}</p>
                </div>
                <button onClick={() => setPopover(null)} className="text-foreground/30 hover:text-foreground/70 shrink-0 transition-colors">
                  <X size={13} />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/40">Status</span>
                  <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/40">Start</span>
                  <span className="text-foreground/70 font-mono">{fmt(sDate)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/40">Due</span>
                  <span className="text-foreground/70 font-mono">{task.dueDate ? fmt(eDate) : '—'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/40">Duration</span>
                  <span className={`font-bold ${cfg.color}`}>{dur}</span>
                </div>
                {task.priority && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground/40">Priority</span>
                    <span className={`font-bold capitalize ${task.priority === 'urgent' ? 'text-red-400' : 'text-foreground/60'}`}>{task.priority}</span>
                  </div>
                )}
                {task.assignee && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground/40">Assignee</span>
                    <span className="text-foreground/70 truncate max-w-[160px]">{task.assignee.username}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
