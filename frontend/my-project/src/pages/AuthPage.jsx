import React, { useContext } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Landmark, Sun, Moon, Sparkles, ShieldCheck } from "lucide-react";
import { Themecontent } from "../context/Themecontext";

function AuthPage() {
  const { theme, setTheme } = useContext(Themecontent);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-250">
      {/* Floating background blur circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl"></div>

      {/* Header controls (Theme toggle) */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600" />
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Header (Outside the Card) */}
        <div className="flex flex-col items-center text-center gap-2 select-none mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            SpendWise
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 justify-center">
            <Sparkles size={12} className="text-teal-500" />
            Smart Budgeting Platform
          </p>
        </div>

        {/* Action Card Box (wrapping description text and buttons) */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center gap-6 relative overflow-hidden">
          
          {/* Description (2 lines of text in center) */}
          <div className="text-sm text-slate-600 dark:text-slate-300 font-medium text-center leading-relaxed">
            <p>Track your daily expenses, monitor your active budget limits,</p>
            <p>and receive smart AI-powered insights to optimize your habits.</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

          {/* Action Buttons (Teal Green palette) */}
          <div className="w-full flex flex-row gap-4">
            {/* Sign In Button */}
            <SignInButton mode="modal">
              <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-md shadow-teal-600/10">
                Sign In
              </button>
            </SignInButton>

            {/* Sign Up Button */}
            <SignUpButton mode="modal">
              <button className="flex-1 bg-transparent hover:bg-teal-50/50 dark:hover:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/30 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secured by Clerk Authentication
          </div>

          {/* Decorative Blur background bubble inside the card */}
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-teal-50 dark:bg-teal-950/10 rounded-full blur-2xl opacity-40"></div>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
