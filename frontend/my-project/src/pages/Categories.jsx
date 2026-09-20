import React, { useState, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  ArrowRight,
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
  TrendingUp,
  Receipt,
  Check,
  PlusCircle,
} from "lucide-react";
import { Navcontent } from "../context/Navcontent";
import { Expensecontent } from "../context/Expensecontent";

// Icon components mapping
const ICON_COMPONENTS = {
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

const COLOR_OPTIONS = [
  { name: "Teal", hex: "#0d9488", bg: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400" },
  { name: "Emerald", hex: "#10b981", bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { name: "Blue", hex: "#3b82f6", bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
  { name: "Purple", hex: "#a855f7", bg: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" },
  { name: "Pink", hex: "#ec4899", bg: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400" },
  { name: "Rose", hex: "#f43f5e", bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" },
  { name: "Amber", hex: "#f59e0b", bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" },
  { name: "Indigo", hex: "#6366f1", bg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" },
  { name: "Slate", hex: "#64748b", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
];

const AVAILABLE_ICONS = [
  { name: "Utensils", label: "Food / Dining" },
  { name: "Car", label: "Transport / Travel" },
  { name: "ShoppingBag", label: "Shopping / Retail" },
  { name: "Film", label: "Entertainment" },
  { name: "Zap", label: "Utilities / Bills" },
  { name: "HeartPulse", label: "Health / Medical" },
  { name: "Dumbbell", label: "Fitness / Gym" },
  { name: "GraduationCap", label: "Education" },
  { name: "Home", label: "Housing / Rent" },
  { name: "Gift", label: "Gifts / Donations" },
  { name: "Briefcase", label: "Work / Freelance" },
  { name: "Plane", label: "Travel / Holiday" },
  { name: "Wallet", label: "Finance / Investment" },
  { name: "Layers", label: "General / Custom" },
];

function Categories() {
  const navigate = useNavigate();
  const { userCategories, addCustomCategory, deleteCustomCategory } =
    useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);

  // Form State for New Category
  const [catName, setCatName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[5].name);
  const [catDesc, setCatDesc] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Spending per category for the current month
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return (expenses || []).filter((e) => {
      if (!e.date) return false;
      const parts = e.date.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        return month === currentMonth && year === currentYear;
      }
      return false;
    });
  }, [expenses]);

  const categoryStats = useMemo(() => {
    const stats = {};
    currentMonthExpenses.forEach((exp) => {
      const cat = exp.category || "Other";
      const amt = parseFloat(exp.amount) || 0;
      if (!stats[cat]) {
        stats[cat] = { total: 0, count: 0 };
      }
      stats[cat].total += amt;
      stats[cat].count += 1;
    });
    return stats;
  }, [currentMonthExpenses]);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const trimmed = catName.trim();
    if (!trimmed) return;

    addCustomCategory({
      id: trimmed,
      label: trimmed,
      icon: selectedIcon,
      color: selectedColor.hex,
      bg: selectedColor.bg,
      desc: catDesc.trim() || `Expenses related to ${trimmed}`,
      isCustom: true,
    });

    setCatName("");
    setCatDesc("");
    setShowCreateModal(false);
  };

  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  const categoriesList = userCategories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto py-6 px-4 space-y-8 font-sans"
    >
      {/* Header Banner - SpendWise Brand Teal */}
      <div className="bg-teal-600 dark:bg-teal-700 p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-teal-600/10 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Layers size={26} className="text-teal-200" />
            Categories Manager
          </h1>
          <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mt-1">
            Explore Existing Categories & Add Custom Spending Buckets
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="relative z-10 px-4 py-2.5 bg-white text-teal-800 hover:bg-teal-50 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} className="text-teal-700" />
          Add Custom Category
        </button>

        {/* Ambient glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Categories
            </h3>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {categoriesList.length}
            </p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Custom Added
            </h3>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {categoriesList.filter((c) => c.isCustom).length}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Month's Categorized Spend
            </h3>
            <p className="text-2xl font-extrabold text-rose-500 dark:text-rose-400 mt-1">
              {formatCurrency(
                Object.values(categoryStats).reduce(
                  (sum, c) => sum + c.total,
                  0,
                ),
              )}
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Available Categories ({categoriesList.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click any category to quickly log an expense
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesList.map((cat) => {
            const IconComp = ICON_COMPONENTS[cat.icon] || Layers;
            const stats = categoryStats[cat.id] || { total: 0, count: 0 };
            const isPreset = !cat.isCustom;

            return (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group relative"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-2xl text-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: cat.color || "#0d9488" }}
                      >
                        <IconComp size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {cat.label}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {isPreset ? "Preset Category" : "Custom Category"}
                        </span>
                      </div>
                    </div>

                    {!isPreset && (
                      <button
                        type="button"
                        onClick={() => deleteCustomCategory(cat.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete Custom Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                    {cat.desc || `Expenses in ${cat.label}`}
                  </p>
                </div>

                {/* Spending Stats & Quick Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      This Month
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(stats.total)}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({stats.count} txns)
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/Expense")}
                    className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl transition-all cursor-pointer"
                    title="Log Expense in this category"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Quick Add Custom Category Card */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 bg-slate-50/50 dark:bg-slate-950/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] transition-all group"
          >
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 mb-2 group-hover:scale-110 transition-transform">
              <PlusCircle size={24} />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Create New Category
            </h4>
            <p className="text-[10px] text-slate-400 mt-1">
              Add a personalized spending category
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- CREATE CUSTOM CATEGORY MODAL --- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-xl">
                    <Plus size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Create Custom Category
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                {/* Category Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Healthcare, Pets, Gym, Education..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                {/* Color Selector — compact dots */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                    Color
                  </span>
                  <div className="flex items-center gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        title={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          selectedColor.name === c.name
                            ? "ring-2 ring-offset-1 ring-slate-500 scale-110"
                            : "hover:scale-110 opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selectedColor.name === c.name && <Check size={9} className="text-white" />}
                      </button>
                    ))}
                  </div>
                  {/* Selected color badge preview */}
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedColor.bg}`}>
                    {selectedColor.name}
                  </span>
                </div>

                {/* Icon Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Select Icon
                  </label>
                  <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    {AVAILABLE_ICONS.map((iconItem) => {
                      const IconComp = ICON_COMPONENTS[iconItem.name] || Layers;
                      const isSelected = selectedIcon === iconItem.name;
                      return (
                        <button
                          key={iconItem.name}
                          type="button"
                          onClick={() => setSelectedIcon(iconItem.name)}
                          className={`p-2.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-teal-600 text-white shadow-sm scale-105"
                              : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                          title={iconItem.label}
                        >
                          <IconComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description for this category..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Categories;
