import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Layers, Grid } from "lucide-react";

/**
 * FloatingFilter component: A physics-based, floating Time-Period Filter Interface.
 * Handles four main categories: Year, Month, Week, and Daily.
 * Spawns dynamic sub-option nodes with drift, float inertia, and orbit animations.
 */
export default function FloatingFilter({ onChange }) {
  const [activeCategory, setActiveCategory] = useState("daily"); // 'yearly' | 'monthly' | 'weekly' | 'daily'
  const [selectedSubOptions, setSelectedSubOptions] = useState({
    yearly: "2026",
    monthly: "Jul",
    weekly: "Week 1",
    daily: new Date().toISOString().slice(0, 10),
  });

  // Main Categories definition
  const categories = [
    { id: "yearly", label: "Year", icon: Layers, color: "from-pink-500 to-rose-500", glow: "shadow-rose-500/25" },
    { id: "monthly", label: "Month", icon: Grid, color: "from-purple-500 to-indigo-500", glow: "shadow-purple-500/25" },
    { id: "weekly", label: "Week", icon: Clock, color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/25" },
    { id: "daily", label: "Daily", icon: CalendarIcon, color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/25" },
  ];

  // Dynamic Sub-options generator
  const getSubOptions = (category) => {
    switch (category) {
      case "yearly":
        return ["2024", "2025", "2026"];
      case "monthly":
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      case "weekly":
        return ["Week 1", "Week 2", "Week 3", "Week 4"];
      case "daily":
        // Daily renders a mini calendar/days list instead of plain options
        return [];
      default:
        return [];
    }
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    // Map catId to matching trendRange
    let rangeMapped = "daily";
    if (catId === "yearly") rangeMapped = "yearly";
    else if (catId === "monthly") rangeMapped = "monthly";
    else if (catId === "weekly") rangeMapped = "weekly";
    else if (catId === "daily") rangeMapped = "daily";

    if (onChange) {
      onChange(rangeMapped, selectedSubOptions[catId]);
    }
  };

  const handleSubOptionClick = (catId, subOpt) => {
    const updated = { ...selectedSubOptions, [catId]: subOpt };
    setSelectedSubOptions(updated);
    
    let rangeMapped = "daily";
    if (catId === "yearly") rangeMapped = "yearly";
    else if (catId === "monthly") rangeMapped = "monthly";
    else if (catId === "weekly") rangeMapped = "weekly";
    else if (catId === "daily") rangeMapped = "daily";

    if (onChange) {
      onChange(rangeMapped, subOpt);
    }
  };

  // Subtle floating background physics drift animations
  const floatAnimation = (delay = 0) => ({
    animate: {
      y: [0, -6, 0],
      rotate: [0, 1, -1, 0],
      transition: {
        duration: 4 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      },
    },
  });

  return (
    <div className="w-full flex flex-col items-center select-none py-6">
      {/* 1. Main Category Nodes Container */}
      <div className="relative flex justify-center gap-6 md:gap-10 items-center px-6 py-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-slate-800/40 shadow-2xl">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <motion.div
              key={cat.id}
              {...floatAnimation(idx * 0.4)}
              className="relative flex flex-col items-center"
            >
              {/* Category Node Bubble */}
              <motion.button
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2.5 px-5 py-3 rounded-full cursor-pointer transition-all duration-300 shadow-lg ${
                  isActive
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-xl ${cat.glow}`
                    : "bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/60"
                }`}
              >
                <Icon size={16} className={isActive ? "animate-pulse" : "opacity-80"} />
                <span className="text-xs font-black tracking-wide uppercase">{cat.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-full bg-current opacity-10 blur-md -z-10"
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  />
                )}
              </motion.button>

              {/* Active orbit pointer indicator */}
              {isActive && (
                <motion.div
                  layoutId="orbitIndicator"
                  className="w-1.5 h-1.5 rounded-full bg-slate-850 dark:bg-white mt-2.5"
                  transition={{ type: "spring", stiffness: 120, damping: 12 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 2. Sub-option Nodes Container (Physics-based expansion & float) */}
      <div className="relative w-full min-h-[100px] flex items-center justify-center mt-6 overflow-visible">
        <AnimatePresence mode="wait">
          {activeCategory && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 140, damping: 15 }}
              className="flex flex-wrap items-center justify-center gap-4 px-6 py-2 max-w-4xl"
            >
              {/* Conditional sub-option renderer */}
              {activeCategory !== "daily" ? (
                // Floating Years, Months, and Weeks nodes
                getSubOptions(activeCategory).map((subOpt, i) => {
                  const isSelected = selectedSubOptions[activeCategory] === subOpt;
                  const catColor = categories.find((c) => c.id === activeCategory)?.color;
                  const catGlow = categories.find((c) => c.id === activeCategory)?.glow;

                  return (
                    <motion.button
                      key={subOpt}
                      type="button"
                      onClick={() => handleSubOptionClick(activeCategory, subOpt)}
                      // Physics drift settings for distinct node inertia
                      {...floatAnimation(i * 0.25)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      // Selected nodes "orbit" closer/lock by scaling up and having stronger shadows
                      className={`px-4 py-2.5 rounded-2xl text-[11px] font-extrabold transition-all duration-300 shadow-sm border cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-r ${catColor} text-white shadow-lg ${catGlow} border-transparent scale-105 font-black`
                          : "bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-slate-200/40 dark:border-slate-800/40 backdrop-blur-sm"
                      }`}
                    >
                      {subOpt}
                    </motion.button>
                  );
                })
              ) : (
                // Daily Category: Floating Interactive Mini Calendar View
                <motion.div
                  {...floatAnimation(0.2)}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-xl flex flex-col items-center gap-3"
                >
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Pick a Day
                  </span>
                  <input
                    type="date"
                    value={selectedSubOptions.daily}
                    onChange={(e) => handleSubOptionClick("daily", e.target.value)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
