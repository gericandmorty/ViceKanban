'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import Footer from '../components/ui/Footer';
import CardSwap, { Card } from '../components/ui/CardSwap';

import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!Cookies.get('access_token'));
  }, []);

  // Use the theme to determine image paths
  const kanbanImage = `/landing/kanban_board_${theme}_mode.png`;
  const ganttImage = `/landing/gantt_chart_${theme}_mode.png`;

  return (
    <div className="min-h-screen bg-bg-subtle text-foreground font-sans flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-bg-subtle text-foreground py-4 px-6 md:px-12 flex items-center justify-between border-b border-border-default/50">
        <div className="flex items-center gap-3">
          <Image src="/icons/icon_vice.png" alt="ViceKanBan Logo" width={32} height={32} unoptimized={true} className="rounded" />
          <span className="font-semibold text-lg hidden md:block">ViceKanBan</span>
        </div>
        <div className="flex items-center gap-4">
          {mounted && isLoggedIn ? (
            <Link href="/dashboard" className="border border-accent/50 bg-accent/10 rounded-md px-4 py-1.5 text-sm font-semibold hover:bg-accent/20 transition-colors text-accent">Go to Dashboard</Link>
          ) : mounted ? (
            <>
              <Link href="/auth/login" className="text-sm font-semibold hover:text-accent transition-colors">Sign in</Link>
              <Link href="/auth/register" className="border border-border-default bg-background rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-bg-subtle transition-colors">Sign up</Link>
            </>
          ) : (
            <div className="w-32 h-8"></div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-24 pb-32 max-w-[92rem] mx-auto grid grid-cols-1 md:grid-cols-12 items-center overflow-hidden min-h-[85vh]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--foreground-rgb),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--foreground-rgb),0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
 
        <div className="col-span-1 md:col-span-10 lg:col-span-5 text-left relative z-10 px-4 md:px-0">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-[4rem] font-extrabold tracking-tight mb-6 leading-[1.1] text-foreground"
          >
            Manage projects <br />
            <span className="text-accent">built for developers.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg md:text-xl leading-relaxed max-w-sm ${theme === 'light' ? 'text-foreground/75' : 'text-foreground/60'}`}
          >
            ViceKanBan is a simple, collaborative project management tool that helps teams organize work, track progress, and ship products faster.
          </motion.p>
        </div>
 
        {/* Visual Mockup Window */}
        <div className="col-span-1 md:col-start-7 md:col-span-6 relative mt-12 md:mt-0 flex items-center justify-end">
          <CardSwap
            width="100%"
            height="auto"
            className="aspect-[16/10]"
            cardDistance={30}
            verticalDistance={35}
            delay={5000}
            skewAmount={1}
          >
            <Card className={`aspect-[16/10] ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} ring-1 ring-white/10 transition-all duration-700`}>
              <div className={`relative w-full h-full ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'}`}>
                <div className={`absolute top-0 left-0 w-full h-9 ${theme === 'dark' ? 'bg-[#161b22]' : 'bg-[#f6f8fa]'} border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/5'} flex items-center px-4 gap-2 z-20`}>
                  <div className="flex gap-1.5 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className={`ml-2 h-5 flex items-center px-3 rounded-md border ${theme === 'dark' ? 'bg-[#0d1117] border-white/10' : 'bg-white border-black/5'} text-[10px] font-medium text-foreground/40 tracking-tight`}>
                    Kanban Board
                  </div>
                </div>
                <div className={`pt-9 w-full h-full ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'} overflow-hidden`}>
                  <Image 
                    src={kanbanImage} 
                    alt="Kanban Board View" 
                    width={1600} 
                    height={1000} 
                    unoptimized={true}
                    className="w-full h-full object-contain opacity-95 transition-opacity hover:opacity-100 duration-500" 
                  />
                </div>
              </div>
            </Card>
            <Card className={`aspect-[16/10] ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} ring-1 ring-white/10 transition-all duration-700`}>
              <div className={`relative w-full h-full ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'}`}>
                <div className={`absolute top-0 left-0 w-full h-9 ${theme === 'dark' ? 'bg-[#161b22]' : 'bg-[#f6f8fa]'} border-b ${theme === 'dark' ? 'border-white/10' : 'border-black/5'} flex items-center px-4 gap-2 z-20`}>
                  <div className="flex gap-1.5 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className={`ml-2 h-5 flex items-center px-3 rounded-md border ${theme === 'dark' ? 'bg-[#0d1117] border-white/10' : 'bg-white border-black/5'} text-[10px] font-medium text-foreground/40 tracking-tight`}>
                    Gantt Chart
                  </div>
                </div>
                <div className={`pt-9 w-full h-full ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'} overflow-hidden`}>
                  <Image 
                    src={ganttImage} 
                    alt="Gantt Chart View" 
                    width={1600} 
                    height={1000} 
                    unoptimized={true}
                    className="w-full h-full object-contain opacity-95 transition-opacity hover:opacity-100 duration-500" 
                  />
                </div>
              </div>
            </Card>
          </CardSwap>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-y border-border-default py-24 px-6 md:px-12 bg-background/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Everything you need, nothing you don't.</h2>
            <p className="text-foreground/60 max-w-2xl mx-auto text-lg">We stripped away the corporate bloat to give you a pure, high-performance issue tracker.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Zero-Latency Architecture</h3>
              <p className="text-foreground/60 leading-relaxed text-sm">Built on top of cutting-edge paradigms. Drag, drop, and aggressively update Kanban cards across columns with zero visual lag.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Deep Work Interface</h3>
              <p className="text-foreground/60 leading-relaxed text-sm">Engineered with a flawless dark mode and strict systematic spacing. Reduce visual clutter so your engineers can focus on shipping.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Secure by Design</h3>
              <p className="text-foreground/60 leading-relaxed text-sm">Bank-grade security embedded into the stack. JWT session scaling, automated password hashing, and strict access control per project.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12 text-center max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">Ready to accelerate your workflow?</h2>
        <p className="text-foreground/60 mb-10 text-lg">Join thousands of developers prioritizing speed and simplicity.</p>
        <Link href="/auth/register" className="bg-foreground text-background rounded-md px-8 py-4 font-bold text-lg hover:opacity-90 transition-all shadow-lg">
          Initialize Workspace
        </Link>
      </section>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
