import React, { useContext, useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { Sun, Moon, Target, ArrowDownCircle, Wallet, Bell, Trash2, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Navcontent } from "../context/Navcontent";
import { Expensecontent } from "../context/Expensecontent";
import { Themecontent } from "../context/Themecontext";

function Navbar() {
  const { navamt, target1, notifications, markAllNotificationsAsRead, clearNotifications } = useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);
  const { theme, setTheme } = useContext(Themecontent);
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = useMemo(() => (notifications || []).filter((n) => !n.read).length, [notifications]);

  // Click away to close notifications dropdown
  useEffect(() => {
    if (!showNotifications) return;
    
    const handleOutsideClick = (event) => {
      const container = document.getElementById("notification-dropdown-container");
      if (container && !container.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showNotifications]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch (e) {
      return timeStr;
    }
  };

  const currentMonthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const parts = e.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      return month === currentMonth && year === currentYear;
    }
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalamt = currentMonthExpenses.reduce((accum, current) => {
    const amt1 = parseFloat(current.amount) || 0;
    return amt1 + accum;
  }, 0);

  const amt2 = navamt - totalamt;

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Home Overview";
      case "/Dashboard":
        return "Analytics Dashboard";
      case "/Expense":
        return "Expenses Log";
      case "/Budget":
        return "Budget Planner";
      case "/Transactions":
        return "Transactions Log";
      default:
        return "SpendWise";
    }
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-3 transition-all duration-305">
      {/* Left side: Contextual Page Title */}
      <div className="self-start md:self-center">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>
      
      {/* Right side: stats + theme toggle + auth actions */}
      <div className="flex flex-wrap gap-3 md:gap-4 justify-between md:justify-end items-center w-full md:w-auto">
        {/* Statistics Badges */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Target
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border border-violet-100/30 dark:border-violet-900/20">
            <Target className="w-3.5 h-3.5 text-violet-500" />
            <span>Target: {target1}</span>
          </div> */}

          {/* Balance */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-900/20">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Balance: {amt2 > 0 ? `${amt2.toFixed(0)} Rs` : "No Balance"}
            </span>
          </div>

          {/* Spent */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-100/30 dark:border-rose-900/20">
            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Spent: {totalamt.toFixed(0)} Rs</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Interactive Actions */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          {/* Global Notification Bell */}
          <div className="relative" id="notification-dropdown-container">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  markAllNotificationsAsRead();
                }
              }}
              className="relative rounded-xl border border-slate-200/80 p-2 text-slate-500 transition-all hover:bg-slate-100/80 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-xl py-3 z-50">
                {/* Header */}
                <div className="flex justify-between items-center px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    Notifications
                  </h4>
                  <button
                    onClick={clearNotifications}
                    className="p-1 text-slate-400 hover:text-rose-550 dark:text-slate-500 dark:hover:text-rose-450 transition-colors cursor-pointer"
                    title="Clear All"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar px-2 divide-y divide-slate-100/60 dark:divide-slate-800/40">
                  {(notifications || []).length === 0 ? (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-6">
                      No notifications yet
                    </p>
                  ) : (
                    (notifications || []).map((notif) => {
                      let Icon = Info;
                      let iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
                      if (notif.type === "success") {
                        Icon = CheckCircle;
                        iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
                      } else if (notif.type === "error" || notif.type === "warning") {
                        Icon = AlertTriangle;
                        iconColor = "text-rose-500 bg-rose-50 dark:bg-rose-950/20";
                      }
                      
                      return (
                        <div key={notif.id} className="py-2.5 px-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl transition-colors flex gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconColor}`}>
                            <Icon size={12} />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300 leading-normal break-words">
                              {notif.text}
                            </p>
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                              {formatTime(notif.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inline Sun/Moon Toggler */}
          <button
            onClick={handleToggleTheme}
            className="rounded-xl border border-slate-200/80 p-2 text-slate-500 transition-all hover:bg-slate-100/80 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-indigo-650" />
            )}
          </button>

          {/* Clerk Auth Actions */}
          <SignedOut>
            <div className="flex gap-2">
              <SignInButton className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-sm cursor-pointer" />
              <SignUpButton className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95 cursor-pointer" />
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-semibold text-slate-600 dark:text-slate-300">
                Welcome, {user?.firstName || user?.fullName}
              </span>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 border border-slate-200 dark:border-slate-800"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
