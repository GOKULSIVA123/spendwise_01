import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Home,
  Target,
  Wallet,
  List,
} from "lucide-react";
import { Navcontent } from "../context/Navcontent";

function Sidebar() {
  const location = useLocation();

  const links = [
    { path: "/", label: "Home", icon: Home },
    { path: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Expense", label: "Expenses", icon: Receipt },
    { path: "/Budget", label: "Budget", icon: Target },
    { path: "/Transactions", label: "Transactions", icon: List },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col p-6 gap-8 shadow-sm shrink-0">
      
      {/* Brand Section */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="bg-teal-600 dark:bg-teal-600 p-2 rounded-lg text-white">
          <Wallet size={20} />
        </div>
        <h2 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
          SpendWise
        </h2>
      </div>

      {/* Navigation Links with Framer Motion Sliding Indicator */}
      <nav className="flex flex-col gap-1.5 relative">
        {links.map((link) => {
          const IconComponent = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs relative group transition-colors duration-250 ${
                isActive
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
              }`}
            >
              {/* Sliding Pill Background Indicator */}
              {isActive && (
                <motion.span
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-teal-50 dark:bg-teal-950/20 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Hover highlight background */}
              {!isActive && (
                <span className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10" />
              )}

              <IconComponent 
                size={16} 
                className={`relative z-10 transition-colors duration-200 ${
                  isActive 
                    ? "text-teal-600 dark:text-teal-400" 
                    : "text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                }`} 
              />
              <span className="relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>



      {/* Footer Branding */}
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2">
          SpendWise © 2026
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
