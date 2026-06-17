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
  const { navamt, target1 } = useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);
  const { getToken } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  // --- LOGIC: Calculation of Financial Status ---
  const spent = expenses.reduce((accum, curr) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full font-sans text-slate-900 bg-slate-50 min-h-full"
    >
      <div className="w-full space-y-10">
        {/* --- 1. Header Section --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              SpendWise <span className="text-indigo-600">Home</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">
              Financial Status & AI Insights
            </p>
          </div>
          <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar size={18} className="text-indigo-600" />
            </div>
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* --- 2. Summary Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Budget */}
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Total Budget
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-indigo-600">
                {formatCurrency(navamt)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <Wallet size={24} />
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Total Spent
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-rose-500">
                {formatCurrency(spent)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 transition-colors group-hover:bg-rose-50 group-hover:text-white">
              <ArrowUpCircle size={24} />
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Remaining
              </h3>
              <p className="text-2xl font-extrabold tracking-tight text-emerald-600">
                {formatCurrency(rem)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <ArrowDownCircle size={24} />
            </div>
          </div>
        </div>

        {/* --- 3. Main Content: AI Assist & Plan --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT: Goal & AI Input Form */}
          <div className="space-y-8">
            {/* Target Goal Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target size={14} className="text-indigo-600" /> Target Month
                  Goal
                </label>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {target1 || "None Set"}
                </h1>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                Active Goal
              </div>
            </div>

            {/* AI Assist Form Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg">
                    Expense AI Assist
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                    Smart Budgeting
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10 ">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">
                  Enter Your Goal
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed px-1">
                  Tell your goal to AI for generating a plan for maintaining
                  your budget.
                </p>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium min-h-[150px] resize-none"
                  placeholder="e.g. Help me save ₹10,000 for an upcoming trip by cutting back on unnecessary dining."
                ></textarea>
              </div>

              <div className="relative z-10 flex flex-row items-start justify-center">
                <div className="w-full">
                  <button
                    onClick={handleAskAI}
                    disabled={loadingPlan}
                    className="w-full bg-slate-900 text-white py-4 px-8 rounded-2xl font-extrabold text-xs uppercase flex items-center justify-center gap-3 transition-all hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 shadow-xl shadow-indigo-100"
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
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-40"></div>
            </div>
          </div>

          {/* RIGHT: AI Result Content Area */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Lightbulb size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  AI Generated Plan
                </h2>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Optimized Guidance
                </p>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 bg-slate-50/50 rounded-3xl border border-slate-100 p-8 overflow-y-auto max-h-[500px] custom-scrollbar">
              {aiResult ? (
                <div className="prose prose-sm prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {aiResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <Sparkles size={56} className="text-slate-200" />
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold text-sm">
                      Waiting for Analysis
                    </p>
                    <p className="text-slate-300 text-xs">
                      Click "Generate Report" to receive your custom strategy.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest">
                <Activity size={14} /> Optimization: Standard
              </div>
              <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
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
