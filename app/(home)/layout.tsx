import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <React.Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
          {children}
        </div>
      </React.Suspense>
    </div>
  );
}
