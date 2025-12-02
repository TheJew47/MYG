"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, ChartBarIcon, CalendarIcon, FolderIcon, Cog6ToothIcon 
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  const sidebarVariants = {
    collapsed: { width: "70px" },
    expanded: { width: "220px" },
  };

  const navItems = [
    { icon: HomeIcon, label: "Dashboard", href: "/dashboard" },
    { icon: FolderIcon, label: "Projects", href: "/" },
    { icon: ChartBarIcon, label: "Analytics", href: "/analytics" },
    { icon: CalendarIcon, label: "Schedule", href: "/schedule" },
  ];

  return (
    <motion.div
      initial="collapsed"
      animate={isHovered ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // UPDATED: Translucent Background
      className="h-screen bg-app-bg/95 backdrop-blur-xl border-r border-app-border flex flex-col py-5 z-50 fixed left-0 top-0 shadow-2xl overflow-hidden transition-all duration-300"
    >
      <div className="flex flex-col gap-2 px-3 mt-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={`flex items-center p-3 rounded-xl transition-all whitespace-nowrap group ${
                isActive 
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                  : "text-text-muted hover:bg-app-hover hover:text-text-main"
              }`}
            >
              <item.icon className="w-6 h-6 min-w-[24px]" />
              <motion.span
                className="ml-4 font-medium text-sm"
                animate={{ opacity: isHovered ? 1 : 0 }}
                style={{ display: isHovered ? "block" : "none" }}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto px-3 mb-4">
        <Link 
          href="/settings"
          className="flex items-center p-3 rounded-xl transition-all whitespace-nowrap text-text-muted hover:bg-app-hover hover:text-text-main"
        >
          <Cog6ToothIcon className="w-6 h-6 min-w-[24px]" />
          <motion.span
            className="ml-4 font-medium text-sm"
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