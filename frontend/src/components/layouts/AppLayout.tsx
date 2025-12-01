"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if the current URL ends with "/create"
  const isFullscreenPage = pathname?.endsWith("/create");

  if (isFullscreenPage) {
    // Fullscreen Mode: No Sidebar, No TopBar
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  // Default Dashboard Mode
  return (
    <>
      <TopBar />
      <Sidebar />
      <main className="pl-[70px] pt-[70px] h-screen overflow-auto">
        {children}
      </main>
    </>
  );
}