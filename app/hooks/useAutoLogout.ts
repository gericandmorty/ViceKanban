'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export function useAutoLogout() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    // Clear all auth-related cookies
    Cookies.remove('access_token');
    Cookies.remove('user_name');
    Cookies.remove('user_id');
    localStorage.removeItem('session_expiry');
    localStorage.removeItem('seen_announcements');
    
    // Redirect to login with timeout param
    if (!pathname.startsWith('/auth')) {
      router.push('/auth/login?timeout=true');
    }
  }, [router, pathname]);

  useEffect(() => {
    // 1. Initial check
    const checkSession = () => {
      const token = Cookies.get('access_token');
      const expiry = localStorage.getItem('session_expiry');
      
      const publicRoutes = ['/', '/about', '/terms', '/privacy'];
      const isPublicPath = publicRoutes.includes(pathname) || pathname.startsWith('/auth');

      if (token && expiry) {
        if (Date.now() > parseInt(expiry)) {
          logout();
        }
      } else if (!token && !isPublicPath) {
        // If token is missing but we are in protected area
        logout();
      }
    };

    checkSession();
    
    // 2. Listen for global unauthorized events (from our API utility)
    const handleUnauthorized = () => {
      console.log('Unauthorized event detected, logging out...');
      logout();
    };
    window.addEventListener('unauthorized', handleUnauthorized);

    // 3. Poll every 10 seconds
    const interval = setInterval(checkSession, 10000);

    // 4. Listen for storage events (e.g. if logout happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session_expiry' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [logout, pathname]);

  return { logout };
}
