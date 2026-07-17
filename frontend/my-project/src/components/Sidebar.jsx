import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Home,
  Target,
  Wallet,
} from "lucide-react";
import { Navcontent } from "../context/Navcontent";

function Sidebar() {
  const { setNavamt } = useContext(Navcontent);
  const [totalamt, setTotalamt] = useState("");
  const location = useLocation();

  const handleSetBudget = (e) => {
    e.preventDefault();
    const newBudgetAmount = parseFloat(totalamt);
    if (isNaN(newBudgetAmount) || newBudgetAmount < 0) {
      return;
    }
    setNavamt(newBudgetAmount);
    setTotalamt("");
  };



  const links = [
    { path: "/", label: "Home", icon: Home },
    { path: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Expense", label: "Expenses", icon: Receipt },
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

      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2"></div>

      {/* Forms Section */}
      <div className="flex flex-col gap-6">
        {/* Set Budget Form */}
        <div className="flex flex-col gap-3 items-start">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-2 flex items-center gap-1.5">
            <Wallet size={12} className="text-teal-500" /> Set Total Budget
          </label>
          <input
            onChange={(e) => setTotalamt(e.target.value)}
            value={totalamt}
            type="number"
            placeholder="₹0.00"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-xs text-slate-800 dark:text-slate-200"
          />
          <button
            onClick={handleSetBudget}
            className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-teal-700 transition-all shadow-md shadow-teal-100/50 dark:shadow-none cursor-pointer"
          >
            Update Budget
          </button>
        </div>
      </div>

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
