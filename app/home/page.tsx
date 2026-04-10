'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  Search, 
  Plus, 
  MoreHorizontal, 
  MessageSquare, 
  GitPullRequest, 
  Clock, 
  Tag, 
  Users, 
  ChevronDown,
  Settings,
  Star,
  GitFork,
  CheckCircle2,
  Circle
} from 'lucide-react';

const mockData = {
  project: {
    name: 'ViceKanBan Core',
    status: 'Public',
    stars: 128,
    forks: 24,
  },
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      count: 3,
      tasks: [
        { id: '1', title: 'Implement JWT refresh tokens', labels: ['security'], assignee: 'GM' },
        { id: '2', title: 'Design system overhaul (GitHub Theme)', labels: ['ui/ux'], assignee: 'AI' },
        { id: '3', title: 'Database schema for organizations', labels: ['backend'], assignee: 'GM' },
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      count: 2,
      tasks: [
        { id: '4', title: 'Connect frontend to login API', labels: ['frontend'], assignee: 'AI' },
        { id: '5', title: 'Websocket setup for live updates', labels: ['realtime'], assignee: 'JD' },
      ]
    },
    {
      id: 'done',
      title: 'Done',
      count: 12,
      tasks: [
        { id: '6', title: 'Basic NestJS setup', labels: ['backend'], assignee: 'GM' },
      ]
    }
  ]
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Board');

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-default bg-bg-subtle hidden lg:flex flex-col">
        <div className="p-4 border-b border-border-default flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">V</div>
          <span className="font-semibold text-sm">ViceKanBan</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recent Projects</span>
              <Plus size={14} className="text-zinc-500 cursor-pointer hover:text-foreground" />
            </div>
            <div className="space-y-1">
              {['ViceKanBan Core', 'Marketing Site', 'API Docs'].map((proj, i) => (
                <div key={i} className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-border-default/50 ${i === 0 ? 'bg-border-default/80 font-medium' : ''}`}>
                  <Layout size={14} className="text-zinc-400" />
                  <span className="truncate">{proj}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Your Teams</span>
            </div>
            <div className="space-y-1">
              {['Engineering', 'Design', 'Product'].map((team, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-border-default/50">
                  <Users size={14} className="text-zinc-400" />
                  <span>{team}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-default">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-border-default/50">
            <Settings size={14} className="text-zinc-400" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border-default bg-background sticky top-0 z-40">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-2 text-xl">
                <Layout size={20} className="text-zinc-400" />
                <span className="font-medium text-accent hover:underline cursor-pointer">gericmorit</span>
                <span className="text-zinc-400">/</span>
                <span className="font-bold">{mockData.project.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full border border-border-default text-[10px] font-medium text-zinc-500 bg-bg-subtle">
                {mockData.project.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn btn-outline py-1 px-3 text-xs flex items-center gap-2 border-border-default">
                <Star size={14} className="text-zinc-400" /> Star <span className="bg-border-default/50 px-1.5 rounded">{mockData.project.stars}</span>
              </button>
              <button className="btn btn-outline py-1 px-3 text-xs flex items-center gap-2 border-border-default">
                <GitFork size={14} className="text-zinc-400" /> Fork <span className="bg-border-default/50 px-1.5 rounded">{mockData.project.forks}</span>
              </button>
            </div>
          </div>

          <div className="px-6 flex gap-8 items-end">
            {['Board', 'Backlog', 'Insights', 'Settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'border-orange-500 text-foreground' 
                    : 'border-transparent text-zinc-500 hover:text-foreground hover:border-zinc-300'
                }`}
              >
                {tab === 'Board' && <Layout size={16} />}
                {tab === 'Backlog' && <Clock size={16} />}
                {tab === 'Insights' && <Search size={16} />}
                {tab === 'Settings' && <Settings size={16} />}
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Board Content */}
        <div className="flex-1 p-6 overflow-x-auto bg-[#fafafa] dark:bg-black">
          <div className="flex gap-6 h-full min-w-[1000px]">
            {mockData.columns.map((column) => (
              <div key={column.id} className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{column.title}</h3>
                    <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {column.count}
                    </span>
                  </div>
                  <MoreHorizontal size={16} className="text-zinc-400 cursor-pointer" />
                </div>

                <div className="flex flex-col gap-3">
                  {column.tasks.map((task, i) => (
                    <motion.div 
                      key={task.id}
                      whileHover={{ y: -2 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-background border border-border-default rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab group active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold group-hover:text-accent transition-colors">
                          {task.title}
                        </h4>
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border-default flex items-center justify-center text-[10px] font-bold text-zinc-600 shrink-0">
                          {task.assignee}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {task.labels.map((label) => (
                          <span key={label} className="px-2 py-0.5 rounded-full border border-border-default text-[10px] bg-bg-subtle text-zinc-500 lowercase flex items-center gap-1">
                            <Tag size={10} /> {label}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-1 text-[10px]">
                          <MessageSquare size={12} /> 2
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <GitPullRequest size={12} /> 1
                        </div>
                        <div className="flex items-center gap-1 text-[10px] ml-auto">
                          <CheckCircle2 size={12} className="text-success" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <button className="flex items-center gap-2 p-2 mt-2 text-sm text-zinc-500 hover:text-accent hover:bg-accent/5 rounded-md transition-all group w-full">
                    <Plus size={16} /> Add task
                  </button>
                </div>
              </div>
            ))}

            <div className="w-80 pt-1">
              <button className="flex items-center gap-2 p-3 text-sm font-medium text-zinc-500 hover:text-foreground hover:bg-border-default/50 rounded-lg border border-dashed border-border-default transition-all w-full">
                <Plus size={16} /> Add column
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
