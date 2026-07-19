import React, { useContext, useState } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  BrainCircuit,
  Sparkles,
  Calendar,
  Send,
  Activity,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navcontent } from "../context/Navcontent";
import { Expensecontent } from "../context/Expensecontent";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

function HomePage() {
  const { navamt } = useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);
  const { getToken } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  // --- LOGIC: Calculation of Financial Status ---
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

  const spent = currentMonthExpenses.reduce((accum, curr) => {
    const val = parseFloat(curr.amount) || 0;
    return val + accum;
  }, 0);

  const rem = navamt - spent;

  // Formatting helper
  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // --- AI API CALL ---
  const handleAskAI = async () => {
    setLoadingPlan(true);
    setAiResult(null);

    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      setAiResult(response.data.report || "No insights available.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResult(
        "Failed to generate AI insights. Check if your backend is running, the Groq API key is set, and your database is connected.",
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  return(
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 min-h-full transition-colors duration-200"
    >
      <div className="w-full space-y-10">
        {/* --- 1. Header Section --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              SpendWise <span className="text-teal-600 dark:text-teal-400">Home</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs mt-1 uppercase tracking-widest">
              Financial Status & AI Insights
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
              <Calendar size={18} className="text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* --- 2. Summary Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Budget */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Monthly Budget
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                {formatCurrency(navamt)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 transition-colors group-hover:bg-teal-600 dark:group-hover:bg-teal-500 group-hover:text-white">
              <Wallet size={24} />
            </div>
          </div>

          {/* Monthly Spent */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Monthly Spent
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-rose-500 dark:text-rose-400">
                {formatCurrency(spent)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 transition-colors group-hover:bg-rose-500 group-hover:text-white">
              <ArrowUpCircle size={24} />
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Remaining Balance
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(rem)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <ArrowDownCircle size={24} />
            </div>
          </div>
        </div>

        {/* --- 3. Main Content: AI Assist & Plan --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT: Goal & AI Input Form */}
          <div className="space-y-8">


            {/* AI Assist Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col gap-6 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 bg-teal-600 dark:bg-teal-600 rounded-xl text-white shadow-lg shadow-teal-200 dark:shadow-none">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    Expense AI Assist
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic">
                    Smart Budgeting
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10 ">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Enter Your Goal
                </label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed px-1">
                  Tell your goal to AI for generating a plan for maintaining
                  your budget.
                </p>
                <textarea
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-sm font-medium min-h-[150px] resize-none text-slate-700 dark:text-slate-300"
                  placeholder="e.g. Help me save ₹10,000 for an upcoming trip by cutting back on unnecessary dining."
                ></textarea>
              </div>

              <div className="relative z-10 flex flex-row items-start justify-center">
                <div className="w-full">
                  <button
                    onClick={handleAskAI}
                    disabled={loadingPlan}
                    className="w-full bg-slate-900 dark:bg-teal-600 text-white py-4 px-8 rounded-2xl font-extrabold text-xs uppercase flex items-center justify-center gap-3 transition-all hover:bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 shadow-xl shadow-teal-600/10 dark:shadow-none cursor-pointer"
                  >
                    {loadingPlan ? (
                      <>
                        <Activity size={16} className="animate-pulse" />
                        ANALYZING...
                      </>
                    ) : (
                      <>
                        GENERATE REPORT
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Decorative Blur Effect */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-teal-50 dark:bg-teal-950/10 rounded-full blur-3xl opacity-40"></div>
            </div>
          </div>

          {/* RIGHT: AI Result Content Area */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Lightbulb size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  AI Generated Plan
                </h2>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Optimized Guidance
                </p>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-8 overflow-y-auto max-h-[500px] custom-scrollbar text-slate-700 dark:text-slate-300">
              {aiResult ? (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {aiResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <Sparkles size={56} className="text-slate-200 dark:text-slate-700" />
                  <div className="space-y-1">
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">
                      Waiting for Analysis
                    </p>
                    <p className="text-slate-300 dark:text-slate-600 text-xs">
                      Click "Generate Report" to receive your custom strategy.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] uppercase tracking-widest">
                <Activity size={14} /> Optimization: Standard
              </div>
              <div className="text-slate-300 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                SpendWise
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HomePage;
