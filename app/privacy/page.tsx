'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, ArrowLeft } from 'lucide-react';
import Footer from '../components/ui/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-subtle flex flex-col font-sans selection:bg-accent/30 text-foreground">
      <header className="px-6 md:px-12 py-6 border-b border-border-default/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={32} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-lg">Privacy Policy</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 text-zinc-300 leading-relaxed">
        <h1 className="text-4xl font-extrabold text-foreground mb-8">Privacy Policy</h1>
        <p className="mb-6 opacity-70">Effective date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Data We Collect</h2>
            <p>When you use ViceKanBan, we naturally collect certain personal information including your provided Email Address, Username, and encrypted Password securely stored in our databases. We also store application data such as tasks, descriptions, and comments generated directly through your interaction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">How We Use Your Data</h2>
            <p>We use your information strictly to provide, maintain, and improve the Services. We use your email strictly for core account security features such as password resets and primary organizational notifications. We do not sell your data to outside marketing or advertising parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Cookies & Storage</h2>
            <p>We use standard HTTP cookies and browser LocalStorage to maintain functional session continuity. To maximize your security, ViceKanBan implements a complete data purge protocol: every single authentication token, session variable, and local preference is immediately and completely deleted from your browser environment the moment you log out.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Data Protection</h2>
            <p>Your data is shielded using modern security safeguards. Passwords are irreversibly hashed leveraging `bcrypt`. However, no method of transmission over the internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
