'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, ArrowLeft } from 'lucide-react';
import Footer from '../components/ui/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col font-sans selection:bg-accent/30 text-[#c9d1d9]">
      <header className="px-6 md:px-12 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Layout size={24} className="text-foreground hover:text-accent transition-colors" />
          </Link>
          <span className="font-semibold text-sm text-[#f0f6fc]">Privacy Policy</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-[#8b949e] hover:text-accent transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to ViceKanBan
        </Link>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#f0f6fc] mb-3 tracking-tight">Privacy Policy</h1>
        <p className="mb-10 text-sm text-[#8b949e]">Effective date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">Data We Collect</h2>
            <p className="text-[#8b949e]">When you use ViceKanBan, we naturally collect certain personal information including your provided Email Address, Username, and encrypted Password securely stored in our databases. We also store application data such as tasks, descriptions, and comments generated directly through your interaction.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">How We Use Your Data</h2>
            <p className="text-[#8b949e]">We use your information strictly to provide, maintain, and improve the Services. We use your email strictly for core account security features such as password resets and primary organizational notifications. We do not sell your data to outside marketing or advertising parties.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">Cookies & Storage</h2>
            <p className="text-[#8b949e]">We use standard HTTP cookies and browser LocalStorage to maintain functional session continuity. To maximize your security, ViceKanBan implements a complete data purge protocol: every single authentication token, session variable, and local preference is immediately and completely deleted from your browser environment the moment you log out.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#f0f6fc] border-b border-[#30363d] pb-2">Data Protection</h2>
            <p className="text-[#8b949e]">Your data is shielded using modern security safeguards. Passwords are irreversibly hashed leveraging `bcrypt`. However, no method of transmission over the internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
