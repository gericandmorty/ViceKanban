'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, ArrowLeft } from 'lucide-react';
import Footer from '../components/ui/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30 text-foreground">
      <header className="px-6 md:px-12 py-6 border-b border-border-default/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={32} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-lg">Terms of Service</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 text-zinc-300 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-foreground mb-8">Terms of Service</h1>
        <p className="mb-6 opacity-70">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using ViceKanBan, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. Description of Service</h2>
            <p>ViceKanBan is a project management tool providing kanban board functionality, task tracking, team collaboration, and workflow organization. We reserve the right to modify, suspend or discontinue the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. User Conduct</h2>
            <p>You agree to use this service only for lawful purposes. You are solely responsible for all code, content, comments, and data you upload. You agree not to upload anything that infringes upon on copyrights or violates any local/international laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Account Security</h2>
            <p>You are strictly responsible for maintaining the confidentiality of your account credentials. You must immediately notify us of any unauthorized use of your account. We will not be liable for any losses caused by stolen credentials.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
