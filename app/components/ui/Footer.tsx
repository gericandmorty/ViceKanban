import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto py-8 px-6 w-full flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border-default/50 text-[12px] text-zinc-500 font-sans">
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground opacity-80">ViceKanBan</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Link href="/about" className="hover:text-accent hover:underline transition-colors">About the Developer</Link>
        <Link href="/terms" className="hover:text-accent hover:underline transition-colors">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-accent hover:underline transition-colors">Privacy Policy</Link>
        <a href="mailto:gericmorit3211@gmail.com" className="hover:text-zinc-300 transition-colors">Contact</a>
      </div>
    </footer>
  );
}
