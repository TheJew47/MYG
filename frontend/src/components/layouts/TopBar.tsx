import { UserCircleIcon, BellIcon } from "@heroicons/react/24/outline";

export default function TopBar() {
  return (
    <div className="h-[70px] bg-app-bg/80 backdrop-blur-md border-b border-app-border flex items-center px-8 justify-between fixed top-0 left-0 right-0 z-40 pl-[90px]">
      <div className="flex items-center gap-3">
        {/* Updated to use logo.png */}
        <img src="/logo.png" alt="MYG Logo" className="h-8 w-auto object-contain" />
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-text-muted hover:text-white transition-colors relative">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-8 w-[1px] bg-app-border"></div>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-white">Admin User</div>
                <div className="text-xs text-text-muted">Pro Plan</div>
            </div>
            <UserCircleIcon className="w-10 h-10 text-text-muted" />
        </div>
      </div>
    </div>
  );
}