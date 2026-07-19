import React, { useContext, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Film, 
  Zap, 
  HelpCircle, 
  TrendingUp, 
  Plus, 
  Minus, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  Coins,
  BarChart3
} from "lucide-react";
import { Navcontent } from "../context/Navcontent";
import { Expensecontent } from "../context/Expensecontent";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Budget() {
  const { navamt, setNavamt, categoryBudgets, setCategoryBudgets, addNotification } = useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);

  // Local state for forms
  const [incomeInput, setIncomeInput] = useState(navamt.toString());
  const [tempBudgets, setTempBudgets] = useState({
    Food: categoryBudgets.Food?.toString() || "0",
    Transport: categoryBudgets.Transport?.toString() || "0",
    Shopping: categoryBudgets.Shopping?.toString() || "0",
    Entertainment: categoryBudgets.Entertainment?.toString() || "0",
    Utilities: categoryBudgets.Utilities?.toString() || "0",
    Other: categoryBudgets.Other?.toString() || "0",
  });



  // Categories definitions
  const categoriesList = [
    { id: "Food", label: "Food", icon: Utensils, iconColor: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/20" },
    { id: "Transport", label: "Transport", icon: Car, iconColor: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/20" },
    { id: "Shopping", label: "Shopping", icon: ShoppingBag, iconColor: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/20" },
    { id: "Entertainment", label: "Entertainment", icon: Film, iconColor: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-50 dark:bg-pink-950/20" },
    { id: "Utilities", label: "Utilities", icon: Zap, iconColor: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/20" },
    { id: "Other", label: "Other", icon: HelpCircle, iconColor: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800/40" },
  ];



  // --- LOGIC: Filter expenses for the current month ---
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses.filter((e) => {
      if (!e.date) return false;
      const parts = e.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        return month === currentMonth && year === currentYear;
      }
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses]);

  // --- LOGIC: Group current month spending by category ---
  const categorySpent = useMemo(() => {
    return currentMonthExpenses.reduce((acc, curr) => {
      const cat = curr.category || "Other";
      const amt = parseFloat(curr.amount) || 0;
      acc[cat] = (acc[cat] || 0) + amt;
      return acc;
    }, {});
  }, [currentMonthExpenses]);

  // --- Save Actions ---
  const handleSaveIncome = async (e) => {
    e.preventDefault();
    const parsedIncome = parseFloat(incomeInput);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Please enter a valid monthly income.");
      return;
    }
    
    const toastId = toast.loading("Saving Monthly Income...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    setNavamt(parsedIncome);
    toast.success(`Set Monthly Income budget limit to ₹${parsedIncome.toLocaleString()}`, { id: toastId });
    addNotification(`Set Monthly Income budget limit to ₹${parsedIncome.toLocaleString()}`, "success");
  };

  const handleSaveBudgets = async (e) => {
    e.preventDefault();
    const newBudgets = {};
    for (const cat of Object.keys(tempBudgets)) {
      const parsedVal = parseFloat(tempBudgets[cat]);
      if (isNaN(parsedVal) || parsedVal < 0) {
        toast.error(`Please enter a valid limit for ${cat}.`);
        return;
      }
      newBudgets[cat] = parsedVal;
    }

    const toastId = toast.loading("Syncing budget limits...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    setCategoryBudgets(newBudgets);
    toast.success("Saved updated Category Budget limits", { id: toastId });
    addNotification("Saved updated Category Budget limits", "success");
  };

  const handleAdjustBudget = (category, amount) => {
    const currentVal = parseFloat(tempBudgets[category]) || 0;
    const newVal = Math.max(0, currentVal + amount);
    setTempBudgets(prev => ({
      ...prev,
      [category]: newVal.toString()
    }));
  };

  const handleBudgetChange = (category, value) => {
    setTempBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // --- Calculations ---
  const totalAllocated = useMemo(() => {
    return Object.values(tempBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [tempBudgets]);

  const remainingUnallocated = navamt - totalAllocated;
  const allocationPercentage = navamt > 0 ? (totalAllocated / navamt) * 100 : 0;

  // --- Chart Data ---
  const barChartData = useMemo(() => {
    const labels = categoriesList.map((cat) => cat.label);
    const budgetData = categoriesList.map((cat) => parseFloat(tempBudgets[cat.id]) || 0);
    const spentData = categoriesList.map((cat) => categorySpent[cat.id] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Allocated",
          data: budgetData,
          backgroundColor: "#6366f1", // Indigo 500
          borderRadius: 4,
        },
        {
          label: "Spent",
          data: spentData,
          backgroundColor: "#10b981", // Emerald 500
          borderRadius: 4,
        },
      ],
    };
  }, [tempBudgets, categorySpent]);

  const barChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "Poppins, sans-serif", size: 8, weight: "bold" },
            color: "#64748b",
            boxWidth: 8,
            padding: 8,
          },
        },
        tooltip: {
          titleFont: { family: "Poppins, sans-serif", size: 10, weight: "bold" },
          bodyFont: { family: "Poppins, sans-serif", size: 9 },
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(148, 163, 184, 0.05)" },
          ticks: { font: { size: 8 }, color: "#64748b" },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 8 }, color: "#64748b" },
        },
      },
    };
  }, []);

  // Format helper
  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 font-sans bg-slate-50 dark:bg-slate-950 min-h-screen w-full text-slate-800 dark:text-slate-100 transition-colors"
    >


      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Budget Planner
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Setup Income & Plan Category Allocations
          </p>
        </div>
      </div>      {/* Top Section: Income, Summary, and Chart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Monthly Income Form Card (Top-Left) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-2xl text-teal-650 dark:text-teal-400">
                <Coins size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-855 dark:text-slate-200">Monthly Income</h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Your Total Limit
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveIncome} className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
              <div className="flex-1 w-full flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                <span className="text-slate-400 dark:text-slate-500 font-extrabold text-sm mr-1.5 select-none">₹</span>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="Enter monthly income"
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 bg-teal-600 text-white px-6 py-3.5 rounded-2xl font-extrabold text-xs uppercase flex items-center justify-center gap-2 transition-all hover:bg-teal-700 shadow-md cursor-pointer h-[46px]"
              >
                <Save size={14} /> Update
              </button>
            </form>
          </div>
        </div>

        {/* Allocation Overview Status Dashboard (Top-Middle) */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 min-h-[220px] flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Allocation Summary
          </h3>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {/* Income */}
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 font-medium">Monthly Income</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(navamt)}</span>
              </div>
              
              {/* Total Allocated */}
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 font-medium">Total Allocated</span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAllocated)}</span>
              </div>

              {/* Unallocated */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-slate-500 font-medium">Unallocated Balance</span>
                <span className={`text-sm font-extrabold ${remainingUnallocated >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {formatCurrency(remainingUnallocated)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-105 dark:bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, allocationPercentage)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full ${
                    allocationPercentage > 100 
                      ? "bg-rose-500" 
                      : allocationPercentage > 85 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{allocationPercentage.toFixed(0)}% Allocated</span>
                {allocationPercentage > 100 && (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={10} /> Overallocated
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget vs Spent Bar Chart (Top-Right) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Budget vs. Spent
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Category Comparison
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/20 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="h-[125px] w-full flex items-center justify-center">
            <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
    </div>

      {/* Bottom Section: Category Budgets (3-column grid layout below) */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800/80 w-full">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Category Budgets</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            Allocate Funds Per Category
          </p>
        </div>

        <form onSubmit={handleSaveBudgets} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoriesList.map((cat) => {
              const Icon = cat.icon;
              const spentAmt = categorySpent[cat.id] || 0;
              const limitAmt = parseFloat(tempBudgets[cat.id]) || 0;
              
              // Compute usage percentage: relative to limit if set, otherwise relative to overall income budget
              const effectiveLimit = limitAmt > 0 ? limitAmt : (navamt > 0 ? navamt : 1);
              const usagePercentage = (spentAmt / effectiveLimit) * 100;
              const isExceeded = spentAmt > limitAmt && limitAmt > 0;

              return (
                <div 
                  key={cat.id} 
                  className="p-4 bg-slate-50/40 dark:bg-slate-950/65 border border-slate-200/60 dark:border-slate-800/80 rounded-[1.5rem] hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all flex flex-col justify-between gap-3 min-h-[145px] shadow-sm"
                >
                  {/* Top section: Icon and Name & Spent */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${cat.bgColor} ${cat.iconColor} shrink-0`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm tracking-tight">{cat.label}</h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          Spent: {formatCurrency(spentAmt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle section: Limit Used text & Mini Horizontal Bar Chart from ChartJS */}
                  <div className="space-y-1.5 my-1.5">
                    {/* Limit Used Details (On Top) */}
                    <div className="flex justify-between items-center text-slate-400 dark:text-slate-500 tracking-wider">
                      {limitAmt > 0 ? (
                        <>
                          <span className={isExceeded ? "text-rose-500 font-black text-xs" : "text-emerald-500 dark:text-emerald-400 font-black text-xs"}>
                            {usagePercentage.toFixed(0)}% Limit Used
                          </span>
                          {isExceeded && (
                            <span className="text-rose-500 font-extrabold text-[10px]">
                              Exceeded by {formatCurrency(spentAmt - limitAmt)}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-500 dark:text-emerald-400 font-black text-xs">
                            {navamt > 0 && spentAmt > 0 ? `${usagePercentage.toFixed(0)}% of Budget` : "Limit not set"}
                          </span>
                          <span className="text-slate-400 italic text-[10px]">No limit set</span>
                        </>
                      )}
                    </div>

                    {/* Tiny Horizontal Bar Chart (Below) */}
                    <div className="h-[22px] w-full mt-2 mb-1.5">
                      <Bar 
                        data={{
                          labels: ["Progress"],
                          datasets: [
                            {
                              label: "Spent",
                              data: [spentAmt],
                              backgroundColor: isExceeded ? "#ef4444" : "#10b981",
                              borderRadius: { 
                                topLeft: 6, 
                                bottomLeft: 6, 
                                topRight: (limitAmt > 0 && spentAmt >= limitAmt) || (limitAmt === 0 && spentAmt >= navamt) ? 6 : 0, 
                                bottomRight: (limitAmt > 0 && spentAmt >= limitAmt) || (limitAmt === 0 && spentAmt >= navamt) ? 6 : 0 
                              },
                              barThickness: 10,
                            },
                            {
                              label: "Remaining",
                              data: [limitAmt > 0 ? Math.max(0, limitAmt - spentAmt) : Math.max(0, navamt - spentAmt)],
                              backgroundColor: "rgba(148, 163, 184, 0.2)",
                              borderRadius: { 
                                topRight: 6, 
                                bottomRight: 6, 
                                topLeft: spentAmt === 0 ? 6 : 0, 
                                bottomLeft: spentAmt === 0 ? 6 : 0 
                              },
                              barThickness: 10,
                            }
                          ]
                        }} 
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              stacked: true,
                              beginAtZero: true,
                              grid: { display: false },
                              ticks: { display: false },
                              border: { display: false }
                            },
                            y: {
                              stacked: true,
                              grid: { display: false },
                              ticks: { display: false },
                              border: { display: false }
                            }
                          }
                        }} 
                      />
                    </div>
                  </div>

                  {/* Bottom section: Budget Limit Inputs */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">
                      Limit
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdjustBudget(cat.id, -500)}
                        className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                      >
                        <Minus size={10} />
                      </button>
                      
                      {/* Flex-based prefix-aligned input wrapper */}
                      <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 focus-within:ring-1 focus-within:ring-teal-500 transition-all">
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold mr-1 select-none">₹</span>
                        <input
                          type="number"
                          value={tempBudgets[cat.id]}
                          onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                          placeholder="0"
                          className="w-16 bg-transparent border-none outline-none text-[10px] font-bold text-slate-700 dark:text-slate-200 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdjustBudget(cat.id, 500)}
                        className="p-1 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="bg-slate-900 dark:bg-teal-650 hover:bg-slate-800 dark:hover:bg-teal-600 bg-teal-600 text-white font-extrabold text-xs uppercase px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-600/10 dark:shadow-none transition-all cursor-pointer"
            >
              <Save size={14} /> Save Category Limits
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
}

export default Budget;
