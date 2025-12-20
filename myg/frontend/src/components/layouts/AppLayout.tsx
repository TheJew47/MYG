"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Logic to identify the Pro NLE Editor page
  // Path format: /projects/[id]/create
  const isEditorPage = pathname.includes("/projects/") && pathname.includes("/create");

  // If we are in the editor, we bypass the TopBar and Sidebar entirely
  if (isEditorPage) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-app-bg">
        {children}
      </main>
    );
  }

  // Standard layout for Dashboard, Projects, Analytics, etc.
  return (
    <>
      <TopBar />
      <Sidebar />
      {/* pl-[64px] aligns with the Sidebar collapsed width (64px).
          pt-14 aligns with the TopBar height (h-14 / 56px).
          This ensures the main page content starts exactly where the fixed bars end.
      */}
      <main className="pl-[64px] pt-14 h-screen overflow-hidden bg-app-bg">
        {children}
      </main>
    </>
  );
}