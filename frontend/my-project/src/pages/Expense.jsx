import React, { useState, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
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
  CheckCircle,
  UploadCloud,
  Sparkles,
  FileCheck,
  CreditCard,
  Smartphone,
  Banknote,
  X,
  AlertCircle,
  Info,
  Plus,
  Layers,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Home,
  Gift,
  Briefcase,
  Plane,
  Wallet,
} from "lucide-react";
import { Expensecontent } from "../context/Expensecontent";
import { Navcontent } from "../context/Navcontent";

const ICON_MAP = {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  HelpCircle,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Home,
  Gift,
  Briefcase,
  Plane,
  Wallet,
  Layers,
};

function Expense() {
  const navigate = useNavigate();
  const { addExpense, expenses } = useContext(Expensecontent);
  const {
    addNotification,
    categoryBudgets,
    getBudgetForMonth,
    userCategories,
    addCustomCategory,
  } = useContext(Navcontent);

  // Mode Switcher: "manual" | "pdf_import"
  const [entryMode, setEntryMode] = useState("manual");

  // Custom Categories State (allows adding new categories dynamically)
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Form State
  const [formdata, setFormdata] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
    paymentMode: "UPI", // "UPI" | "Card" | "Cash"
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // PDF Upload State (Frontend UI preview)
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  const baseCategoryPresets = {
    Food: {
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20",
      quickSuggestions: ["Swiggy", "Zomato", "Groceries", "Coffee", "Dinner"],
    },
    Transport: {
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/20",
      quickSuggestions: ["Uber", "Ola", "Petrol / Fuel", "Metro", "Bus Ticket"],
    },
    Shopping: {
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 hover:bg-purple-100/50 dark:hover:bg-purple-900/20",
      quickSuggestions: ["Amazon", "Myntra", "Clothing", "Electronics", "Gifts"],
    },
    Entertainment: {
      color: "text-pink-600 bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30 hover:bg-pink-100/50 dark:hover:bg-pink-900/20",
      quickSuggestions: ["Netflix", "Cinema / Movie", "Spotify", "Gaming", "Outing"],
    },
    Utilities: {
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
      quickSuggestions: ["Electricity Bill", "Wi-Fi Bill", "Mobile Recharge", "Water Bill", "House Rent"],
    },
    Other: {
      color: "text-slate-600 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
      quickSuggestions: ["Medicine", "Fitness", "Education", "Maintenance", "Misc"],
    },
  };

  // Combined dynamic list from global userCategories
  const allCategories = (userCategories || []).map((cat) => {
    const IconComp =
      typeof cat.icon === "string"
        ? ICON_MAP[cat.icon] || Layers
        : cat.icon || Layers;
    const preset = baseCategoryPresets[cat.id] || {};
    return {
      id: cat.id,
      label: cat.label || cat.id,
      icon: IconComp,
      color:
        preset.color ||
        "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30 hover:bg-teal-100/50",
      activeColor: "bg-teal-600 border-teal-600 text-white shadow-sm",
      quickSuggestions: preset.quickSuggestions || [
        cat.label || cat.id,
        "General",
        "Recurring",
      ],
    };
  });

  const handleAddCustomCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    addCustomCategory({
      id: trimmed,
      label: trimmed,
      icon: "Layers",
      color: "#0d9488",
      bg: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
      desc: `Expenses related to ${trimmed}`,
      isCustom: true,
    });

    setFormdata((prev) => ({ ...prev, category: trimmed }));
    setNewCatName("");
    setIsAddingCustom(false);
  };

  const paymentModes = [
    { id: "UPI", label: "UPI / GPay", icon: Smartphone },
    { id: "Card", label: "Card", icon: CreditCard },
    { id: "Cash", label: "Cash", icon: Banknote },
  ];

  const quickAmounts = [100, 500, 1000, 2000];

  const activeCategoryObj =
    allCategories.find((c) => c.id === formdata.category) || baseCategories[0];

  const handlechange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevdata) => ({ ...prevdata, [name]: value }));
  };

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

  // Category Budget Calculation for Live Feedback
  const expMonthKey = formdata.date
    ? formdata.date.slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  const expMonthBudget = getBudgetForMonth(expMonthKey);
  const monthCategoryBudgets = expMonthBudget.categories || {};
  const currentCategoryLimit =
    parseFloat(monthCategoryBudgets[formdata.category]) || 0;

  const currentCategorySpent = expenses
    .filter((exp) => {
      if (exp.category !== formdata.category || !exp.date) return false;
      return exp.date.startsWith(expMonthKey);
    })
    .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  const projectedCategorySpent =
    currentCategorySpent + (parseFloat(formdata.amount) || 0);

  const handlesubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || showSuccess) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const limit = currentCategoryLimit;
    const newSpent = projectedCategorySpent;

    addExpense({
      title: formdata.title,
      amount: formdata.amount,
      category: formdata.category,
      date: formdata.date,
      notes: formdata.notes
        ? `${formdata.notes} [${formdata.paymentMode}]`
        : `[${formdata.paymentMode}]`,
    });

    addNotification(
      `Spent ₹${parseFloat(formdata.amount).toFixed(0)} on ${formdata.category} ("${formdata.title}")`,
      "success",
    );

    if (limit > 0 && newSpent > limit) {
      addNotification(
        `Warning: "${formdata.category}" category limit of ₹${limit} has been exceeded!`,
        "error",
      );
    }

    setIsSubmitting(false);
    setShowSuccess(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    setFormdata({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
      paymentMode: "UPI",
      notes: "",
    });
    setShowSuccess(false);
    navigate("/Dashboard");
  };

  // --- PDF Dropzone Handlers ---
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSimulateParse = () => {
    if (!selectedFile) return;
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
    }, 2000);
  };

  // Current Month Expenses for Sidebar Feed
  const currentMonthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const parts = e.date.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
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
        {/* Left Column: Form / Uploader Card (Col span 7) */}
        <div className="lg:col-span-7">
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800/80 overflow-hidden">
            {/* Form Header: Styled in Signature SpendWise Teal (bg-teal-600) */}
            <div className="bg-teal-600 dark:bg-teal-700 px-6 py-4 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative z-10">
                <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-200" />
                  Log Transaction
                </h1>
                <p className="text-teal-100 text-[10px] uppercase tracking-widest font-bold mt-0.5">
                  SpendWise Tracker
                </p>
              </div>

              {/* Mode Toggle Pills (Manual vs PDF Upload) */}
              <div className="relative z-10 flex bg-teal-900/40 backdrop-blur-md p-1 rounded-xl border border-teal-400/20">
                <button
                  type="button"
                  onClick={() => setEntryMode("manual")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    entryMode === "manual"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-teal-100 hover:text-white"
                  }`}
                >
                  <FileText size={12} />
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("pdf_import")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    entryMode === "pdf_import"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-teal-100 hover:text-white"
                  }`}
                >
                  <UploadCloud size={13} />
                  Upload Statement (PDF)
                </button>
              </div>
            </div>

            {/* --- VIEW 1: MANUAL ENTRY FORM --- */}
            {entryMode === "manual" ? (
              <form onSubmit={handlesubmit} className="p-6 space-y-5">
                {/* Expense Name & Smart Suggestions */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <FileText
                      size={12}
                      className="text-teal-600 dark:text-teal-400"
                    />{" "}
                    Expense Name
                  </label>
                  <input
                    onChange={handlechange}
                    value={formdata.title}
                    type="text"
                    name="title"
                    placeholder="e.g. Swiggy, Uber, Groceries, Rent..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:focus:border-teal-500 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                    required
                  />

                  {/* Smart Category Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 ml-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Quick:
                    </span>
                    {activeCategoryObj.quickSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setFormdata((prev) => ({
                            ...prev,
                            title: suggestion,
                          }))
                        }
                        className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100/80 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-md border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount field with shortcuts & Live Category Budget Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign
                        size={12}
                        className="text-teal-600 dark:text-teal-400"
                      />{" "}
                      Amount (₹)
                    </label>

                    {/* Live Budget Utilization Chip */}
                    {currentCategoryLimit > 0 && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          projectedCategorySpent > currentCategoryLimit
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40"
                            : "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900/40"
                        }`}
                      >
                        {formdata.category} Limit: ₹
                        {currentCategoryLimit.toLocaleString()} (₹
                        {currentCategorySpent.toLocaleString()} spent)
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center max-w-[280px]">
                    <span className="absolute left-4 pointer-events-none text-slate-500 dark:text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      onChange={handlechange}
                      value={formdata.amount}
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:focus:border-teal-500 transition-all text-sm font-extrabold text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>

                  {/* Quick Add Amount Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1 ml-1">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAmount(amt)}
                        className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-teal-50 dark:bg-slate-950 dark:hover:bg-teal-950/30 text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg transition-all border border-slate-200/60 hover:border-teal-200 dark:border-slate-800/80 dark:hover:border-teal-900/50 cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                    {formdata.amount && (
                      <button
                        type="button"
                        onClick={handleClearAmount}
                        className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg transition-all border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Category selector grid with + Custom Category option */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Tag
                        size={12}
                        className="text-teal-600 dark:text-teal-400"
                      />{" "}
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(!isAddingCustom)}
                      className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} />{" "}
                      {isAddingCustom ? "Cancel" : "Add Custom"}
                    </button>
                  </div>

                  {/* Inline Add Custom Category Field */}
                  <AnimatePresence>
                    {isAddingCustom && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/40 rounded-xl flex items-center gap-2 mb-2"
                      >
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Healthcare, Pets, Investment, Gym..."
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-bold shadow-sm hover:bg-teal-700 cursor-pointer"
                        >
                          Add & Select
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Category Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {allCategories.map((cat) => {
                      const IconComponent = cat.icon;
                      const isSelected = formdata.category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setFormdata((prev) => ({
                              ...prev,
                              category: cat.id,
                            }))
                          }
                          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border transition-all text-center gap-1 cursor-pointer group ${
                            isSelected
                              ? `${cat.activeColor} border-transparent font-bold scale-[1.02]`
                              : `${cat.color} border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800`
                          }`}
                        >
                          <IconComponent
                            size={15}
                            className={
                              isSelected ? "text-white" : "text-current"
                            }
                          />
                          <span className="text-[10px] font-bold tracking-tight truncate max-w-full">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Payment Mode Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date field with Presets */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar
                          size={12}
                          className="text-teal-600 dark:text-teal-400"
                        />{" "}
                        Date
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPresetDate("today")}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                            formdata.date ===
                            new Date().toISOString().slice(0, 10)
                              ? "bg-teal-600 border-teal-600 text-white"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetDate("yesterday")}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                            formdata.date ===
                            new Date(Date.now() - 86400000)
                              .toISOString()
                              .slice(0, 10)
                              ? "bg-teal-600 border-teal-600 text-white"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100"
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
                      className="w-full px-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                    />
                  </div>

                  {/* Payment Mode Badges */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <CreditCard
                        size={12}
                        className="text-teal-600 dark:text-teal-400"
                      />{" "}
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {paymentModes.map((pm) => {
                        const ModeIcon = pm.icon;
                        const isSelected = formdata.paymentMode === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() =>
                              setFormdata((prev) => ({
                                ...prev,
                                paymentMode: pm.id,
                              }))
                            }
                            className={`py-1.5 px-1 text-center rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            <ModeIcon size={12} />
                            {pm.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare
                        size={12}
                        className="text-teal-600 dark:text-teal-400"
                      />{" "}
                      Notes
                    </label>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Optional
                    </span>
                  </div>
                  <textarea
                    onChange={handlechange}
                    name="notes"
                    value={formdata.notes}
                    placeholder="Add brief details or receipt reference..."
                    rows="2"
                    maxLength="100"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-xs font-medium text-slate-800 dark:text-slate-200 resize-none"
                  />
                  <div className="text-right text-[8px] text-slate-400 dark:text-slate-500 font-medium -mt-1 mr-1">
                    {formdata.notes.length}/100 characters
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || showSuccess}
                  className={`w-full text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer shadow-md shadow-teal-600/20 ${
                    showSuccess
                      ? "bg-teal-600"
                      : isSubmitting
                        ? "bg-teal-400"
                        : "bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
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
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
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
            ) : (
              /* --- VIEW 2: SMART PDF STATEMENT UPLOADER (CLEAN & COMPACT) --- */
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Import Financial Statement
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload your bank statement PDF (HDFC, SBI, ICICI, Axis,
                    Chase, etc.) to automatically extract and categorize
                    transactions.
                  </p>
                </div>

                {/* Compact Drag & Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 mb-2">
                    <UploadCloud size={24} />
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile
                      ? selectedFile.name
                      : "Drag & drop your statement PDF here"}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Supports .pdf files up to 10MB
                  </p>

                  <button
                    type="button"
                    className="mt-3 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50"
                  >
                    Browse Files
                  </button>
                </div>

                {/* Selected File Card Preview */}
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 shrink-0">
                        <FileCheck size={16} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {selectedFile.name}
                        </h5>
                        <p className="text-[10px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready for
                          AI Parsing
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                )}

                {/* Compact Action Button */}
                <button
                  type="button"
                  onClick={handleSimulateParse}
                  disabled={!selectedFile || isParsing}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md ${
                    !selectedFile
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                      : isParsing
                        ? "bg-teal-400 text-white cursor-wait"
                        : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 cursor-pointer"
                  }`}
                >
                  {isParsing ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Parsing Statement with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Parse Statement & Categorize
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <Info size={13} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>
                    Your statement is processed securely. Data is normalized and
                    categorized automatically before you review and approve.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Transactions Feed (Col span 5) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                Recent Transactions
              </h2>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Current Month's History
              </p>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {currentMonthExpenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 italic text-xs">
                  No transactions logged this month
                </div>
              ) : (
                currentMonthExpenses.slice(0, 6).map((exp) => {
                  const catObj =
                    allCategories.find((c) => c.id === exp.category) ||
                    baseCategories[5];
                  const CatIcon = catObj.icon;
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl ${catObj.color} text-current flex items-center justify-center shrink-0`}
                        >
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
