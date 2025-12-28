"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  FolderIcon, 
  SparklesIcon,
  ChartBarIcon, 
  CalendarIcon, 
  Cog6ToothIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // Premium Sidebar Variants: Ultra-slim to sleek expansion
  const sidebarVariants = {
    collapsed: { width: "64px" },
    expanded: { width: "240px" },
  };

  const navItems = [
    { icon: HomeIcon, label: "Home", href: "/dashboard" },
    { icon: FolderIcon, label: "Projects", href: "/" },
    { icon: SparklesIcon, label: "Create AI", href: "/create" }, 
    { icon: ChartBarIcon, label: "Analytics", href: "/analytics" },
    { icon: CalendarIcon, label: "Content Calendar", href: "/schedule" },
    { icon: GlobeAltIcon, label: "Discover", href: "/discover" },
  ];

  return (
    <motion.div
      initial="collapsed"
      animate={isHovered ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-screen bg-app-bg border-r border-app-border flex flex-col py-6 z-[60] transition-all duration-300 ease-in-out shadow-premium"
    >
      {/* Branding: Logo only, visible only when expanded and scaled correctly */}
      <div className="flex items-center justify-center px-4 mb-10 overflow-hidden min-h-[48px]">
        <AnimatePresence>
          {isHovered && (
            <motion.img 
              key="sidebar-logo"
              src="/logo.png" 
              alt="MYG Logo" 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="h-12 w-auto object-contain flex-shrink-0" 
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex items-center h-10 rounded-editor transition-premium whitespace-nowrap group relative ${
                isActive 
                  ? "bg-app-hover text-text-accent" 
                  : "text-text-muted hover:bg-app-hover hover:text-white"
              }`}
            >
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              </div>
              
              <motion.span
                className="ml-2 font-medium text-[13px]"
                animate={{ opacity: isHovered ? 1 : 0 }}
                style={{ display: isHovered ? "block" : "none" }}
              >
                {item.label}
              </motion.span>

              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 w-[2px] h-5 bg-text-accent rounded-r-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Settings Action: In its own separate bottom box */}
      <div className="mt-auto px-3 border-t border-app-border pt-4">
        <Link 
          href="/settings"
          className={`flex items-center h-10 rounded-editor transition-premium whitespace-nowrap group ${
            pathname === "/settings" 
              ? "bg-app-hover text-text-accent" 
              : "text-text-muted hover:bg-app-hover hover:text-white"
          }`}
        >
          <div className="w-10 flex items-center justify-center flex-shrink-0">
            <Cog6ToothIcon className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <motion.span
            className="ml-2 font-medium text-[13px]"
            animate={{ opacity: isHovered ? 1 : 0 }}
            style={{ display: isHovered ? "block" : "none" }}
          >
            Settings
          </motion.span>
        </Link>
      </div>
    </motion.div>
  );
}
