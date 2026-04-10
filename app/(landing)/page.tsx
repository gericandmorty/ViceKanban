'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Layout, Shield, Zap, MarkGithub } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-header-bg text-header-text py-4 px-6 md:px-12 flex items-center justify-between border-b border-border-default/20">
        <div className="flex items-center gap-4">
          <Layout size={32} className="text-white" />
          <div className="flex items-center gap-4 hidden md:flex">
            <span className="font-semibold text-lg">ViceKanBan</span>
            <nav className="flex gap-4 text-sm font-medium opacity-80">
              <Link href="#" className="hover:text-white transition-colors">Product</Link>
              <Link href="#" className="hover:text-white transition-colors">Solutions</Link>
              <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Search or jump to..." 
              className="bg-[#0d1117] border border-border-default/30 rounded-md py-1 px-3 text-sm w-60 focus:w-80 transition-all focus:outline-none focus:bg-background focus:text-foreground"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] border border-border-default/30 rounded px-1.5 py-0.5 opacity-50">/</span>
          </div>
          <Link href="/auth/login" className="text-sm font-semibold hover:opacity-80 transition-opacity">Sign in</Link>
          <Link href="/auth/register" className="border border-white/30 rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-white/10 transition-colors">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 pt-24 pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            Manage projects <br />
            <span className="text-accent">built for developers.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-foreground opacity-70 mb-10 max-w-2xl leading-relaxed"
          >
            ViceKanBan is a simple, collaborative project management tool that helps teams 
            organize work, track progress, and ship products faster.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/auth/register" className="btn btn-primary h-12 px-8 text-lg rounded-lg">
              Get started for free
            </Link>
            <Link href="#" className="btn btn-outline h-12 px-8 text-lg rounded-lg border-border-default">
              Contact sales
            </Link>
          </motion.div>
        </div>
        <div className="flex-1 w-full max-w-xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-subtle border border-border-default rounded-xl p-4 shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 p-2 border-b border-border-default">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="text-xs opacity-50 ml-2">vicekanban.io — 80×24</span>
            </div>
            <div className="space-y-4 p-4 font-mono text-sm opacity-80">
              <p className="text-accent underline">vk-init project-dashboard</p>
              <p className="text-foreground">Initializing vice-kanban project stack...</p>
              <p className="text-success">✓ MongoDB connection established</p>
              <p className="text-success">✓ Auth module initialized</p>
              <p className="text-foreground animate-pulse">_</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-bg-subtle border-y border-border-default py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-center">Everything you need, nothing you don't.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <Zap className="text-accent" size={32} />
              <h3 className="text-xl font-bold">Fast as lightning</h3>
              <p className="opacity-70 leading-relaxed">Built for speed. Drag, drop, and update cards with zero latency across your entire team.</p>
            </div>
            <div className="space-y-4">
              <Shield className="text-success" size={32} />
              <h3 className="text-xl font-bold">Secure by default</h3>
              <p className="opacity-70 leading-relaxed">Enterprise-grade security with encrypted data and robust authentication powered by JWT.</p>
            </div>
            <div className="space-y-4">
              <Layout className="text-orange-500" size={32} />
              <h3 className="text-xl font-bold">Clean Interface</h3>
              <p className="opacity-70 leading-relaxed">A focus on typography and systematic spacing, reducing clutter so you can focus on shipping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 border-t border-border-default mt-20 opacity-70">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layout size={24} />
            <span className="font-bold">ViceKanBan</span>
          </div>
          <p className="text-sm max-w-xs">Connecting developers around the world to build better software together.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 text-sm font-medium">
          <div className="flex flex-col gap-3">
            <span className="text-foreground font-bold">Product</span>
            <Link href="#" className="hover:text-accent">Features</Link>
            <Link href="#" className="hover:text-accent">Integrations</Link>
            <Link href="#" className="hover:text-accent">Security</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-foreground font-bold">Support</span>
            <Link href="#" className="hover:text-accent">Docs</Link>
            <Link href="#" className="hover:text-accent">Community</Link>
            <Link href="#" className="hover:text-accent">Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-foreground font-bold">Company</span>
            <Link href="#" className="hover:text-accent">About</Link>
            <Link href="#" className="hover:text-accent">Blog</Link>
            <Link href="#" className="hover:text-accent">Careers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
