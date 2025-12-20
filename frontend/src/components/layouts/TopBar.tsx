"use client";
import { usePathname } from "next/navigation";
import { UserCircleIcon, BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function TopBar() {
  const pathname = usePathname();
  
  // Logic: Show search only on the Home (Dashboard) and Projects main pages
  // Based on your Sidebar links: Home is "/dashboard" and Projects is "/"
  const showSearch = pathname === "/dashboard" || pathname === "/";

  return (
    <div className="h-14 bg-app-bg/80 backdrop-blur-xl border-b border-app-border flex items-center px-6 justify-between fixed top-0 left-0 right-0 z-[50] pl-20">
      {/* Search Area - Conditional Visibility */}
      <div className="flex items-center gap-4 min-w-[256px]">
        {showSearch && (
          <div className="relative group">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="bg-app-input border border-app-border rounded-editor py-1.5 pl-9 pr-4 text-[13px] text-white w-64 focus:border-text-accent/50 transition-all placeholder:text-text-muted/50"
            />
          </div>
        )}
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-5">
        <button className="text-text-muted hover:text-white transition-premium relative p-1.5 hover:bg-app-hover rounded-editor group">
            <BellIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-text-accent rounded-full border border-app-bg"></span>
        </button>
        
        <div className="h-4 w-[1px] bg-app-border"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group hover:bg-app-hover pl-2 pr-1 py-1 rounded-editor transition-premium">
            <div className="text-right hidden md:block">
                <div className="text-[12px] font-bold text-white leading-tight">Admin User</div>
                <div className="text-[10px] text-text-accent font-semibold tracking-wide uppercase leading-tight">Pro Plan</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-app-input border border-app-border flex items-center justify-center overflow-hidden group-hover:border-text-accent/50 transition-colors">
                <UserCircleIcon className="w-7 h-7 text-text-muted" />
            </div>
        </div>
      </div>
    </div>
  );
}