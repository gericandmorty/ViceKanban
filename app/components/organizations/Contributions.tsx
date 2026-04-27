'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  ShieldCheck,
  TrendingUp,
  Activity,
  Search,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { API_URL, apiFetch } from '@/app/utils/api';
import { getObfuscatedCookie } from '@/app/utils/cookieUtils';
import Loading from '@/app/components/ui/Loading';

interface ContributionStats {
  todo: number;
  in_progress: number;
  done: number;
  reviewed: number;
}

interface MemberContribution {
  user: {
    _id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  role: string;
  stats: ContributionStats;
}

export default function Contributions({ orgId }: { orgId: string }) {
  const [contributions, setContributions] = useState<MemberContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected member inspection state
  const [selectedMember, setSelectedMember] = useState<MemberContribution | null>(null);
  const [memberTasks, setMemberTasks] = useState<any[]>([]);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);

  // 500ms Debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchContributions = async (targetPage: number, append: boolean = false, searchTerm: string = '') => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const response = await apiFetch(
        `/organizations/${orgId}/contributions?page=${targetPage}&limit=9&search=${searchTerm}`
      );
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setContributions(prev => [...prev, ...data.members]);
        } else {
          setContributions(data.members || []);
        }
        setHasMore(data.page < data.totalPages);
        setPage(data.page);
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Re-fetch when debounced search or orgId changes
  useEffect(() => {
    fetchContributions(1, false, debouncedSearch);
  }, [orgId, debouncedSearch]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchContributions(page + 1, true, debouncedSearch);
    }
  };

  const fetchMemberTasks = async (member: MemberContribution) => {
    setSelectedMember(member);
    setIsFetchingTasks(true);
    setMemberTasks([]);

    try {
      const response = await apiFetch(
        `/tasks/org/${orgId}/user/${member.user._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setMemberTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch member tasks:', error);
    } finally {
      setIsFetchingTasks(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'DONE': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'REVIEWED': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  const currentUserId = getObfuscatedCookie('user_id');

  if (isLoading && page === 1 && !debouncedSearch) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loading size="lg" message="Loading activity data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 animate-in fade-in duration-500 max-w-7xl">
      <div className="px-2 border-b border-border-default pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
            Organization Activity
          </h2>
          <p className="text-sm text-foreground/40 mt-1">Cross-project task distribution and member landing.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border-default rounded-md text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {contributions.map((member, idx) => {
          // Fix NaN by ensuring every status is at least 0
          const todo = member.stats?.todo || 0;
          const inProgress = member.stats?.in_progress || 0;
          const done = member.stats?.done || 0;
          const reviewed = member.stats?.reviewed || 0;
          const finalized = done + reviewed;
          const total = todo + inProgress + finalized;
          const isMe = member.user._id === currentUserId;

          return (
            <motion.div
              key={member.user._id + idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (idx % 9) * 0.03 }}
              onClick={() => fetchMemberTasks(member)}
              className={`bg-background border rounded-md overflow-hidden flex flex-col transition-all cursor-pointer group hover:border-accent/50 ${
                isMe 
                ? 'border-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.15)] ring-1 ring-accent/30' 
                : 'border-border-default'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="relative">
                  {member.user.avatarUrl ? (
                    <img 
                      src={member.user.avatarUrl} 
                      alt={member.user.username} 
                      className="w-12 h-12 rounded-md border border-border-default object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-bg-subtle border border-border-default flex items-center justify-center text-foreground font-bold text-lg">
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-foreground truncate group-hover:text-accent transition-colors cursor-pointer">
                      {member.user.username}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-border-default text-foreground/40 font-medium bg-bg-subtle">
                      {member.role}
                    </span>
                  </div>
                  <p className="text-[12px] text-foreground/40 truncate mt-0.5">{member.user.email}</p>
                </div>
              </div>

              <div className="px-4 py-3 bg-bg-subtle/50 border-t border-border-default grid grid-cols-3 gap-1">
                <div className="flex flex-col">
                  <span className="text-[11px] text-foreground/40">Finished</span>
                  <span className="text-[16px] font-medium text-foreground">{finalized}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-foreground/40">Active</span>
                  <span className="text-[16px] font-medium text-foreground">{inProgress}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-foreground/40">To Do</span>
                  <span className="text-[16px] font-medium text-foreground">{todo}</span>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-border-default flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-[11px] text-foreground/40">Working on <span className="text-foreground font-semibold">{total}</span> total tasks</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {(isLoading || isLoadingMore) && page === 1 && contributions.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center">
             <Loading size="md" message="Searching..." />
          </div>
        )}

        {!isLoading && contributions.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border border-dashed border-border-default rounded-md">
            <Activity size={32} className="text-foreground/10 mb-4" />
            <p className="text-sm text-foreground/40">No members match your search criteria.</p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8 border-t border-border-default mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="btn btn-outline flex items-center gap-2 px-6 py-2 transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Loading more...
              </>
            ) : (
              'Load more contributors'
            )}
          </button>
        </div>
      )}

      {/* Task Inspector Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background border border-border-default rounded-xl w-full max-w-7xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border-default flex items-center justify-between bg-bg-subtle/30">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedMember.user.avatarUrl ? (
                    <img 
                      src={selectedMember.user.avatarUrl} 
                      alt={selectedMember.user.username} 
                      className="w-12 h-12 rounded-lg border border-border-default object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                      {selectedMember.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Tasks for {selectedMember.user.username}</h3>
                  <p className="text-sm text-foreground/40">{selectedMember.user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
              >
                <X size={20} className="text-foreground/40" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-x-auto p-6">
              {isFetchingTasks ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Loading size="lg" message="Fetching active tasks..." />
                </div>
              ) : memberTasks.length > 0 ? (
                <div className="flex gap-6 min-w-[1000px] h-full pb-2">
                  {[
                    { id: 'todo', label: 'To Do', icon: <Clock size={16} />, tasks: memberTasks.filter(t => t.status === 'todo') },
                    { id: 'in_progress', label: 'In Progress', icon: <PlayCircle size={16} />, tasks: memberTasks.filter(t => t.status === 'in_progress') },
                    { id: 'done', label: 'Done', icon: <CheckCircle2 size={16} />, tasks: memberTasks.filter(t => t.status === 'done') },
                    { id: 'reviewed', label: 'Reviewed', icon: <ShieldCheck size={16} />, tasks: memberTasks.filter(t => t.status === 'reviewed') }
                  ].map((column) => (
                    <div key={column.id} className="flex-1 flex flex-col min-w-[240px] bg-bg-subtle/20 rounded-xl border border-border-default overflow-hidden">
                      {/* Column Header */}
                      <div className="px-4 py-3 border-b border-border-default bg-bg-subtle/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/60">{column.icon}</span>
                          <span className="text-[13px] font-bold text-foreground">{column.label}</span>
                        </div>
                        <span className="text-[11px] font-bold bg-bg-subtle px-2 py-0.5 rounded-full text-foreground/40 border border-border-default">
                          {column.tasks.length}
                        </span>
                      </div>

                      {/* Task List */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent hover:scrollbar-thumb-foreground/20 transition-colors">
                        {column.tasks.length > 0 ? (
                          column.tasks.map((task) => (
                            <div 
                              key={task._id} 
                              className="group p-3 bg-background border border-border-default rounded-lg hover:border-accent/40 hover:shadow-sm transition-all flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-tight truncate">
                                  {task.project?.name}
                                </span>
                                {task.priority === 'urgent' && (
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                )}
                              </div>
                              <h4 className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
                                {task.title}
                              </h4>
                              {task.dueDate && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Clock size={10} className="text-foreground/20" />
                                  <span className="text-[10px] text-foreground/30">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center justify-center py-10 opacity-20 filter grayscale">
                             <Activity size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <Activity size={48} className="text-foreground/5 mb-4" />
                  <p className="font-semibold text-foreground/60">No active tasks assigned</p>
                  <p className="text-sm text-foreground/30 mt-1">This member currently has no tasks in this organization.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-bg-subtle/10 border-t border-border-default flex justify-end">
              <button 
                onClick={() => setSelectedMember(null)}
                className="px-6 py-2 bg-foreground text-background font-bold rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div className="h-40" />
    </div>
  );
}
