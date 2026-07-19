import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  DollarSign, 
  Tag, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  HelpCircle,
  CheckCircle
} from "lucide-react";
import { Expensecontent } from "../context/Expensecontent";
import { Navcontent } from "../context/Navcontent";

function Expense() {
  const navigate = useNavigate();
  const { addExpense, expenses } = useContext(Expensecontent);
  const { addNotification, categoryBudgets } = useContext(Navcontent);
  
  const [formdata, setFormdata] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    { 
      id: "Food", 
      label: "Food", 
      icon: Utensils, 
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20",
      activeColor: "bg-emerald-500 border-emerald-500 text-white shadow-sm"
    },
    { 
      id: "Transport", 
      label: "Transport", 
      icon: Car, 
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
      activeColor: "bg-blue-500 border-blue-500 text-white shadow-sm"
    },
    { 
      id: "Shopping", 
      label: "Shopping", 
      icon: ShoppingBag, 
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 hover:bg-purple-100/50 dark:hover:bg-purple-900/20",
      activeColor: "bg-purple-600 border-purple-600 text-white shadow-sm"
    },
    { 
      id: "Entertainment", 
      label: "Entertainment", 
      icon: Film, 
      color: "text-pink-600 bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30 hover:bg-pink-100/50 dark:hover:bg-pink-900/20",
      activeColor: "bg-pink-500 border-pink-500 text-white shadow-sm"
    },
    { 
      id: "Utilities", 
      label: "Utilities", 
      icon: Zap, 
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
      activeColor: "bg-amber-500 border-amber-500 text-white shadow-sm"
    },
    { 
      id: "Other", 
      label: "Other", 
      icon: HelpCircle, 
      color: "text-slate-600 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
      activeColor: "bg-slate-700 border-slate-700 text-white shadow-sm"
    },
  ];

  const handlechange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevdata) => ({ ...prevdata, [name]: value }));
    console.log(formdata);
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || showSuccess) return;
    
    setIsSubmitting(true);

    // Premium visual delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Check category limit threshold
    const limit = parseFloat(categoryBudgets[formdata.category]) || 0;
    const catExpenses = currentMonthExpenses.filter((exp) => exp.category === formdata.category);
    const catSpent = catExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const newSpent = catSpent + parseFloat(formdata.amount);

    addExpense(formdata);

    // Trigger global notifications
    addNotification(`Spent ₹${parseFloat(formdata.amount).toFixed(0)} on ${formdata.category} ("${formdata.title}")`, "success");
    if (limit > 0 && newSpent > limit) {
      addNotification(`Warning: "${formdata.category}" category limit of ₹${limit} has been exceeded!`, "error");
    }

    setIsSubmitting(false);
    setShowSuccess(true);
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    setFormdata({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowSuccess(false);
    navigate("/Dashboard");
  };

  const quickAmounts = [100, 500, 1000, 2000];

  const handleQuickAmount = (val) => {
    setFormdata((prev) => ({
      ...prev,
      amount: String((parseFloat(prev.amount) || 0) + val),
    }));
  };

  const handleClearAmount = () => {
    setFormdata((prev) => ({
      ...prev,
      amount: "",
    }));
  };

  const setPresetDate = (preset) => {
    let d = new Date();
    if (preset === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    setFormdata((prev) => ({ ...prev, date: d.toISOString().slice(0, 10) }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // --- LOGIC: Filter expenses for the current month ---
  const currentMonthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const parts = e.date.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // 0-indexed
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return month === currentMonth && year === currentYear;
    }
    return false;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto py-6 px-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Card (Col span 7) */}
        <div className="lg:col-span-7">
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-805/80 overflow-hidden">
            
            {/* Form Header: Styled in High Contrast Teal */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 relative">
              <div className="relative z-10">
                <h1 className="text-lg font-bold tracking-tight text-teal-600 dark:text-teal-400">Log Transaction</h1>
                <p className="text-slate-400 dark:text-slate-555 text-[10px] uppercase tracking-widest font-semibold mt-0.5">
                  SpendWise Tracker
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handlesubmit} className="p-5 space-y-4">
              
              {/* Expense Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <FileText size={12} className="text-teal-500" /> Expense Name
                </label>
                <input
                  onChange={handlechange}
                  value={formdata.title}
                  type="text"
                  name="title"
                  placeholder="Groceries, Fuel, Rent..."
                  className="w-full max-w-md px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-xs font-medium text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              {/* Amount field with shortcuts */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <DollarSign size={12} className="text-teal-500" /> Amount (₹)
                </label>
                <div className="relative flex items-center max-w-[240px]">
                  <span className="absolute left-4 pointer-events-none text-slate-500 dark:text-slate-400 font-bold text-sm">₹</span>
                  <input
                    onChange={handlechange}
                    value={formdata.amount}
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-xs font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
                {/* Quick Add Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1 ml-1">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 hover:bg-teal-50 dark:bg-slate-950 dark:hover:bg-teal-950/30 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg transition-all border border-slate-200/60 hover:border-teal-200 dark:border-slate-800/80 dark:hover:border-teal-900/50 cursor-pointer"
                    >
                      +₹{amt}
                    </button>
                  ))}
                  {formdata.amount && (
                    <button
                      type="button"
                      onClick={handleClearAmount}
                      className="px-2.5 py-1 text-[10px] font-bold bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 text-rose-655 dark:text-rose-400 rounded-lg transition-all border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Category selector grid */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Tag size={12} className="text-teal-500" /> Category
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = formdata.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormdata((prev) => ({ ...prev, category: cat.id }))}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all text-center gap-1.5 cursor-pointer group ${
                          isSelected
                            ? `${cat.activeColor} border-transparent font-bold`
                            : `${cat.color} border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`
                        }`}
                      >
                        <IconComponent 
                          size={16} 
                          className={isSelected ? "text-white" : "text-current"} 
                        />
                        <span className="text-[10px] font-bold tracking-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date field with Presets */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} className="text-teal-500" /> Date
                  </label>
                  
                  {/* Date Presets */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetDate("today")}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                        formdata.date === new Date().toISOString().slice(0, 10)
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate("yesterday")}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                        formdata.date === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  onChange={handlechange}
                  value={formdata.date}
                  type="date"
                  name="date"
                  className="w-full max-w-md px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-teal-500" /> Notes
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Optional
                  </span>
                </div>
                <textarea
                  onChange={handlechange}
                  name="notes"
                  value={formdata.notes}
                  placeholder="Describe this transaction..."
                  rows="2"
                  maxLength="100"
                  className="w-full max-w-md px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-all text-xs font-medium text-slate-800 dark:text-slate-200 resize-none"
                ></textarea>
                <div className="text-right text-[8px] text-slate-400 dark:text-slate-500 font-medium -mt-1 mr-1">
                  {formdata.notes.length}/100 characters
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || showSuccess}
                className={`w-full max-w-md text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer ${
                  showSuccess
                    ? "bg-emerald-500"
                    : isSubmitting
                    ? "bg-teal-400"
                    : "bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-700"
                }`}
              >
                {showSuccess ? (
                  <>
                    Logged!
                    <CheckCircle size={14} className="animate-bounce" />
                  </>
                ) : isSubmitting ? (
                  <>
                    Saving...
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : (
                  <>
                    Save Transaction
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: Recent Transactions Feed (Col span 5) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Recent Transactions</h2>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Current Month's History
              </p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {currentMonthExpenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic text-xs">
                  No transactions logged this month
                </div>
              ) : (
                currentMonthExpenses.slice(0, 5).map((exp) => {
                  // Find matching category object
                  const catObj = categories.find((c) => c.id === exp.category) || categories[5];
                  const CatIcon = catObj.icon;
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl ${catObj.color} text-current flex items-center justify-center shrink-0`}>
                          <CatIcon size={14} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {exp.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            {exp.category} • {formatDate(exp.date)}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 shrink-0">
                        -₹{parseFloat(exp.amount).toFixed(0)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default Expense;