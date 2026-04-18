import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { SidebarProvider } from '../context/SidebarContext';
import AdminGuard from '../components/admin/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden relative">
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
            <AdminGuard>
              {children}
            </AdminGuard>
          </div>
        </React.Suspense>
      </div>
    </SidebarProvider>
  );
}
