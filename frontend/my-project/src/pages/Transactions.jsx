import React, { useState, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  HelpCircle,
  TrendingDown,
  XCircle,
  FileText
} from "lucide-react";
import { Expensecontent } from "../context/Expensecontent";

function Transactions() {
  const navigate = useNavigate();
  const { expenses } = useContext(Expensecontent);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest" | "highest" | "lowest"

  const categoriesObj = {
    Food: { icon: Utensils, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
    Transport: { icon: Car, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
    Shopping: { icon: ShoppingBag, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30" },
    Entertainment: { icon: Film, color: "text-pink-600 bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30" },
    Utilities: { icon: Zap, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
    Other: { icon: HelpCircle, color: "text-slate-655 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800/80" }
  };

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  // Filter and Sort Expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.title.toLowerCase().includes(query) ||
          (exp.notes && exp.notes.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((exp) => exp.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      const amtA = parseFloat(a.amount) || 0;
      const amtB = parseFloat(b.amount) || 0;

      if (sortOrder === "newest") return dateB - dateA;
      if (sortOrder === "oldest") return dateA - dateB;
      if (sortOrder === "highest") return amtB - amtA;
      if (sortOrder === "lowest") return amtA - amtB;
      return 0;
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, sortOrder]);

  // Statistics
  const totalAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce(
      (sum, exp) => sum + (parseFloat(exp.amount) || 0),
      0
    );
  }, [filteredAndSortedExpenses]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto py-6 px-4 font-sans text-slate-800 dark:text-slate-100"
    >
      {/* Header with Back button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} className="text-slate-600 dark:text-slate-350" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transaction History
            </h1>
            <p className="text-slate-455 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">
              Review and filter all your expenditures
            </p>
          </div>
        </div>

        {/* Total Stats summary */}
        <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Total Filtered Spend
            </p>
            <h3 className="text-xl font-black text-rose-500 dark:text-rose-400">
              {formatCurrency(totalAmount)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-805/80 shadow-md flex flex-col md:flex-row gap-4 items-center mb-6">
        
        {/* Search */}
        <div className="relative flex-1 w-full flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-555 transition-all">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search by transaction title or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-200"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Filter Category */}
        <div className="w-full md:w-48 relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-3">
          <Filter size={14} className="text-slate-400 mr-2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {Object.keys(categoriesObj).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="w-full md:w-44 relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl px-4 py-3">
          <Calendar size={14} className="text-slate-400 mr-2" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-md">
        <div className="space-y-3">
          {filteredAndSortedExpenses.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 italic text-xs flex flex-col items-center justify-center gap-3">
              <FileText size={40} className="text-slate-300 dark:text-slate-700" />
              <span>No transactions match the selected filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {filteredAndSortedExpenses.map((exp) => {
                  const catConfig = categoriesObj[exp.category] || categoriesObj.Other;
                  const Icon = catConfig.icon;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      key={exp.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 rounded-[1.5rem] transition-all gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-3 rounded-2xl ${catConfig.color} flex items-center justify-center shrink-0`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm truncate">
                            {exp.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            {exp.category} • {formatDate(exp.date)}
                          </p>
                          {exp.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic mt-1 bg-white/50 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 w-fit">
                              "{exp.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                        <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                          -₹{parseFloat(exp.amount).toFixed(0)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Transactions;
