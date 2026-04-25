'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, ArrowLeft } from 'lucide-react';
import Footer from '../../components/ui/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-accent/30 text-foreground/80">
      <header className="px-6 md:px-12 py-4 border-b border-border-default bg-bg-subtle flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={24} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-sm text-foreground">Terms of Service</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-foreground/60 hover:text-accent transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to ViceKanBan
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Terms of Service</h1>
        <p className="mb-10 text-sm text-foreground/60">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border-default pb-2">1. Acceptance of Terms</h2>
            <p className="text-foreground/60">By accessing and using ViceKanBan, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border-default pb-2">2. Description of Service</h2>
            <p className="text-foreground/60">ViceKanBan is a project management tool providing kanban board functionality, task tracking, team collaboration, and workflow organization. We reserve the right to modify, suspend or discontinue the Service at any time.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border-default pb-2">3. User Conduct</h2>
            <p className="text-foreground/60">You agree to use this service only for lawful purposes. You are solely responsible for all code, content, comments, and data you upload. You agree not to upload anything that infringes upon on copyrights or violates any local/international laws.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border-default pb-2">4. Account Security</h2>
            <p className="text-foreground/60">You are strictly responsible for maintaining the confidentiality of your account credentials. You must immediately notify us of any unauthorized use of your account. We will not be liable for any losses caused by stolen credentials.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
