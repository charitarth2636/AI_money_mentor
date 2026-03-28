"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, User, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState("My Account");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://127.0.0.1:8000/api/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === "success" && data.data.full_name) {
          setUserName(data.data.full_name);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/profile": "Profile & Settings",
      "/Portfolio": "Financial Portfolio",
      "/mentor": "AI Money Mentor",
    };
    return titles[pathname] || "Money Mentor";
  };

  const getPageSubtitle = () => {
    if (pathname === "/profile") return "Manage your Indian financial identity";
    if (pathname === "/Portfolio") return "Track your ₹ spending patterns";
    return "Financial Intelligence";
  };

  if (!mounted) return <div className="h-20 w-full" />;

  const isDark = theme === "dark";

  // Dynamic Theme Classes
  const s = {
    container: isDark 
      ? "bg-[#08080A]/80 border-white/5 text-white" 
      : "bg-white/80 border-slate-200 text-slate-900",
    dropdown: isDark 
      ? "bg-[#1C1F26] border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]" 
      : "bg-white border-slate-200 shadow-xl",
    itemHover: isDark ? "hover:bg-white/5 text-slate-300" : "hover:bg-slate-50 text-slate-600",
    toggleBtn: isDark 
      ? "bg-white/5 border-white/10 text-yellow-400 hover:border-yellow-400/50" 
      : "bg-slate-50 border-slate-200 text-indigo-600 hover:border-indigo-500",
  };

  return (
    <nav className={`h-20 flex items-center justify-between px-8 border-b backdrop-blur-md sticky top-0 z-100 transition-all duration-500 ${s.container}`}>
      
      {/* LEFT: DYNAMIC TITLES */}
      <div className="flex flex-col">
        <motion.h1 
          key={pathname + "title"}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          {getPageTitle()}
        </motion.h1>
        <motion.p 
          key={pathname + "sub"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          {getPageSubtitle()}
        </motion.p>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-4">
        
        {/* THEME TOGGLE */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`p-2.5 rounded-xl border transition-all duration-300 group ${s.toggleBtn}`}
        >
          {isDark ? (
            <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          ) : (
            <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />
          )}
        </button>

        {/* PROFILE DROP DOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pr-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <User size={18} />
            </div>
            <Sparkles size={14} className="text-indigo-500 animate-pulse" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute right-0 mt-3 w-64 rounded-2xl p-2 border z-110 ${s.dropdown}`}
              >
                <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 mb-2">
                  <p className="text-sm font-bold">{userName}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                    Premium Member
                  </p>
                </div>

                <div className="space-y-1">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${s.itemHover}`}
                  >
                    <User size={16} className="text-indigo-500" /> Profile Settings
                  </Link>

                  <div className="h-px bg-slate-100 dark:bg-white/5 my-2 mx-2" />

                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all">
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}