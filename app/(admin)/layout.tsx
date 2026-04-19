import React from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { SidebarProvider } from '../context/SidebarContext';
import AdminGuard from '../components/admin/AdminGuard';
import Loading from '../components/ui/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden relative">
        <React.Suspense fallback={<Loading size="lg" fullScreen={true} />}>
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
