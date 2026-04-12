'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Layout, ArrowLeft, Mail } from 'lucide-react';
import Footer from '../components/ui/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30 text-foreground">
      <header className="px-6 md:px-12 py-6 border-b border-border-default/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={32} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-lg">About the Developer</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12">
        <div className="flex flex-col items-center md:items-start space-y-6">
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-accent to-purple-600 p-1">
            <div className="w-full h-full bg-bg-subtle rounded-full flex items-center justify-center overflow-hidden">
               <Image src="/geric.png" alt="Geric Morit" width={192} height={192} className="object-cover w-full h-full" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground">Geric Morit</h2>
            <p className="text-zinc-400">Full-Stack Software Engineer</p>
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/gericandmorty" target="_blank" rel="noreferrer" className="p-2 border border-border-default rounded-md hover:bg-border-default transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </a>
            <a href="https://web.facebook.com/geric.morit.t/" target="_blank" rel="noreferrer" className="p-2 border border-border-default rounded-md hover:bg-border-default transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="mailto:gericmorit.dev@gmail.com" className="p-2 border border-border-default rounded-md hover:bg-border-default transition-colors">
              <Mail size={20} />
            </a>
          </div>
        </div>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <h1 className="text-4xl font-extrabold text-foreground mb-6">Building the Future of Work.</h1>
          
          <p>
            Hello! I'm Geric, the creator and primary developer behind ViceKanBan. 
          </p>
          
          <p>
            I built ViceKanBan because I was tired of bloated, overwhelmingly slow project management tools that prioritized enterprise marketing over actual developer experience. I wanted something fast, heavily keyboard-focused, and cloaked in a pristine dark-mode aesthetic that modern developers actually want to stare at.
          </p>
          
          <p>
            My stack for this project incorporates cutting-edge technologies spanning <strong>Next.js App Router (React 18)</strong>, <strong>NestJS</strong> for strict structured backend scaling, and <strong>Mongoose/MongoDB</strong> for flexible document models. Every visual interaction relies on high-performance TailwindCSS paired with Framer Motion.
          </p>
          
          <p>
            Outside of coding ViceKanBan, I enjoy researching scalable architectures, tweaking Neovim configs, and constantly finding ways to optimize workflows. Feel free to reach out directly via my email or check out the project's source on my GitHub.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
