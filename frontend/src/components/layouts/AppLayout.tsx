// frontend/src/components/layouts/AppLayout.tsx
"use client";

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    // 1. Outer container: Full viewport height, no window scroll
    <div className="flex h-screen w-full bg-neutral-900 text-white overflow-hidden">
      
      {/* 2. Sidebar: Will sit naturally on the left */}
      <Sidebar />

      {/* 3. Right Side: Flex column (TopBar + Main Content) */}
      <div className="flex flex-col flex-1 w-full min-w-0">
        <TopBar />
        
        {/* 4. Main Content Area: Takes remaining height, scrolls internally */}
        <main className="flex-1 overflow-y-auto p-6 relative">
           {children}
        </main>
      </div>
    </div>
  );
}
