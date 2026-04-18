'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import Footer from '../components/ui/Footer';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!Cookies.get('access_token'));
  }, []);

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
      <section className="relative px-6 md:px-12 pt-24 pb-32 max-w-[92rem] mx-auto flex flex-col lg:flex-row items-center justify-between overflow-hidden min-h-[90vh]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--foreground-rgb),0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--foreground-rgb),0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="w-full lg:w-5/12 text-left relative z-10 lg:pr-10 pb-12 lg:pb-0">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-[4rem] font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            Manage projects <br />
            <span className="text-accent">built for developers.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-foreground/60 max-w-2xl leading-relaxed"
          >
            ViceKanBan is a simple, collaborative project management tool that helps teams organize work, track progress, and ship products faster.
          </motion.p>
        </div>

        {/* Visual Mockup Window */}
        <div className="w-full lg:w-7/12 max-w-[1050px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.2)] overflow-hidden border border-border-default/50 relative bg-bg-subtle"
          >
            <Image 
              src="/landing/kanban_board.png" 
              alt="ViceKanBan Dashboard Interface" 
              width={1600} 
              height={1000} 
              unoptimized={true}
              className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" 
              priority
            />
          </motion.div>
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
