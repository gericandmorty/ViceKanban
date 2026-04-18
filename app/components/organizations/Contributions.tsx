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
  Search
} from 'lucide-react';
import { API_URL } from '@/app/utils/api';
import Cookies from 'js-cookie';

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
      const token = Cookies.get('access_token');
      const response = await fetch(
        `${API_URL}/organizations/${orgId}/contributions?page=${targetPage}&limit=9&search=${searchTerm}`, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
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

  const currentUserId = Cookies.get('user_id');

  if (isLoading && page === 1 && !debouncedSearch) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-foreground/40" size={32} />
          <p className="text-sm text-foreground/40 font-medium">Loading activity data...</p>
        </div>
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
              className={`bg-background border rounded-md overflow-hidden flex flex-col transition-all ${
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
             <Loader2 className="animate-spin text-foreground/40" size={24} />
             <p className="text-sm text-foreground/40 mt-2">Searching...</p>
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
    </div>
  );
}
