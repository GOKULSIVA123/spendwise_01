import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Expensecontent } from "../context/Expensecontent";
import { Navcontent } from "../context/Navcontent";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Calendar,
  CreditCard,
  Sparkles,
  Target,
  ArrowRight,
} from "lucide-react";

// --- 1. Register ChartJS Components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

function Dashboard() {
  const navigate = useNavigate();
  const { expenses } = useContext(Expensecontent);
  const { navamt } = useContext(Navcontent);
  const [trendRange, setTrendRange] = useState("daily"); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [trendSubValue, setTrendSubValue] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleRangeChange = (newRange) => {
    setTrendRange(newRange);
    if (newRange === "daily") {
      setTrendSubValue(new Date().toISOString().slice(0, 10));
    } else if (newRange === "weekly") {
      setTrendSubValue("Week 4");
    } else if (newRange === "monthly") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      setTrendSubValue(monthNames[new Date().getMonth()]);
    } else if (newRange === "yearly") {
      setTrendSubValue(new Date().getFullYear().toString());
    }
  };

  // --- 2. CALCULATIONS ---
  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses.filter((e) => {
      if (!e.date) return false;
      const parts = e.date.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        return month === currentMonth && year === currentYear;
      }
      const d = new Date(e.date);
      return (
        !isNaN(d.getTime()) &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });
  }, [expenses]);

  const totalamt = useMemo(() => {
    return currentMonthExpenses.reduce((accum, curr) => {
      return accum + (parseFloat(curr.amount) || 0);
    }, 0);
  }, [currentMonthExpenses]);

  const remainingBalance = navamt - totalamt;

  const categoryTotals = useMemo(() => {
    return currentMonthExpenses.reduce((acc, curr) => {
      const cat = curr.category || "Other";
      const amt = parseFloat(curr.amount) || 0;
      acc[cat] = (acc[cat] || 0) + amt;
      return acc;
    }, {});
  }, [currentMonthExpenses]);

  const labels = useMemo(() => Object.keys(categoryTotals), [categoryTotals]);
  const dataValues = useMemo(
    () => Object.values(categoryTotals),
    [categoryTotals],
  );

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long" });
  }, []);

  const barData = {
    labels: labels,
    datasets: [
      {
        label: "Expenses",
        data: dataValues,
        backgroundColor: [
          "#6366f1", // Indigo 500
          "#ec4899", // Pink 500
          "#10b981", // Emerald 500
          "#f59e0b", // Amber 500
          "#3b82f6", // Blue 500
        ],
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: { font: { family: "Poppins", size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "Poppins", size: 10 } },
      },
    },
  };

  // B) Doughnut Data
  const doughnutData = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          "#6366f1",
          "#ec4899",
          "#10b981",
          "#f59e0b",
          "#3b82f6",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { family: "Poppins", size: 10 } },
      },
    },
  };

  // C) Today's Expenses Data
  const expensesToday = expenses.filter(
    (expense) => expense.date === new Date().toISOString().slice(0, 10),
  );

  // D) Filtered Expenses for Transactions List based on Floating Filter Node
  const filteredExpenses = useMemo(() => {
    if (!trendSubValue) return expenses;

    const parseExpenseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0]),
          month: parseInt(parts[1]) - 1,
          day: parseInt(parts[2]),
        };
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? null
        : {
            year: d.getFullYear(),
            month: d.getMonth(),
            day: d.getDate(),
          };
    };

    if (trendRange === "daily") {
      return expenses.filter((e) => e.date === trendSubValue);
    }

    if (trendRange === "weekly") {
      const todayDate = new Date();
      let offsetIndex = 3; // default Week 4 (current)
      if (trendSubValue === "Week 1") offsetIndex = 0;
      else if (trendSubValue === "Week 2") offsetIndex = 1;
      else if (trendSubValue === "Week 3") offsetIndex = 2;
      else if (trendSubValue === "Week 4") offsetIndex = 3;

      const startDay = new Date();
      startDay.setDate(todayDate.getDate() - ((3 - offsetIndex) * 7 + 6));
      const endDay = new Date();
      endDay.setDate(todayDate.getDate() - (3 - offsetIndex) * 7);

      const startTs = new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate(),
        0,
        0,
        0,
        0,
      ).getTime();
      const endTs = new Date(
        endDay.getFullYear(),
        endDay.getMonth(),
        endDay.getDate(),
        23,
        59,
        59,
        999,
      ).getTime();

      return expenses.filter((e) => {
        const parsed = parseExpenseDate(e.date);
        if (!parsed) return false;
        const expTs = new Date(parsed.year, parsed.month, parsed.day).getTime();
        return expTs >= startTs && expTs <= endTs;
      });
    }

    if (trendRange === "monthly") {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const targetMonth = monthNames.indexOf(trendSubValue);
      if (targetMonth === -1) return expenses;
      const targetYear = new Date().getFullYear();

      return expenses.filter((e) => {
        const parsed = parseExpenseDate(e.date);
        return (
          parsed && parsed.month === targetMonth && parsed.year === targetYear
        );
      });
    }

    if (trendRange === "yearly") {
      const targetYear = parseInt(trendSubValue);
      if (isNaN(targetYear)) return expenses;
      return expenses.filter((e) => {
        const parsed = parseExpenseDate(e.date);
        return parsed && parsed.year === targetYear;
      });
    }

    return expenses;
  }, [expenses, trendRange, trendSubValue]);

  // E) Multi-option Trend Data (Daily, Weekly, Monthly, Yearly)
  const trendChartData = useMemo(() => {
    const todayDate = new Date();
    const labels = [];
    const expenseData = [];
    const incomeData = [];

    const parseExpenseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0]),
          month: parseInt(parts[1]) - 1,
          day: parseInt(parts[2]),
        };
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? null
        : {
            year: d.getFullYear(),
            month: d.getMonth(),
            day: d.getDate(),
          };
    };

    if (trendRange === "daily") {
      // Daily defaults to selected day trendSubValue, displaying 7 days leading up to it
      let baseDate = new Date();
      if (trendSubValue) {
        const parts = trendSubValue.split("-");
        if (parts.length === 3) {
          baseDate = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
          );
        } else {
          baseDate = new Date(trendSubValue);
        }
      }
      if (isNaN(baseDate.getTime())) baseDate = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dayLabel = d.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });
        labels.push(dayLabel);

        const daySpend = expenses
          .filter((e) => {
            const parsed = parseExpenseDate(e.date);
            return (
              parsed &&
              parsed.year === d.getFullYear() &&
              parsed.month === d.getMonth() &&
              parsed.day === d.getDate()
            );
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        expenseData.push(daySpend);
        incomeData.push(navamt);
      }
    } else if (trendRange === "weekly") {
      for (let i = 3; i >= 0; i--) {
        const startDay = new Date();
        startDay.setDate(todayDate.getDate() - (i * 7 + 6));
        const endDay = new Date();
        endDay.setDate(todayDate.getDate() - i * 7);

        labels.push(`Week ${4 - i}`);

        const startTs = new Date(
          startDay.getFullYear(),
          startDay.getMonth(),
          startDay.getDate(),
          0,
          0,
          0,
          0,
        ).getTime();
        const endTs = new Date(
          endDay.getFullYear(),
          endDay.getMonth(),
          endDay.getDate(),
          23,
          59,
          59,
          999,
        ).getTime();

        const weekSpend = expenses
          .filter((e) => {
            const parsed = parseExpenseDate(e.date);
            if (!parsed) return false;
            const expTs = new Date(
              parsed.year,
              parsed.month,
              parsed.day,
            ).getTime();
            return expTs >= startTs && expTs <= endTs;
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        expenseData.push(weekSpend);
        incomeData.push(navamt);
      }
    } else if (trendRange === "monthly") {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // avoid 31st overflow bug
        d.setMonth(todayDate.getMonth() - i);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
        labels.push(monthLabel);

        const targetMonth = d.getMonth();
        const targetYear = d.getFullYear();

        const monthSpend = expenses
          .filter((e) => {
            const parsed = parseExpenseDate(e.date);
            return (
              parsed &&
              parsed.month === targetMonth &&
              parsed.year === targetYear
            );
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        expenseData.push(monthSpend);
        incomeData.push(navamt);
      }
    } else if (trendRange === "yearly") {
      for (let i = 2; i >= 0; i--) {
        const targetYear = todayDate.getFullYear() - i;
        labels.push(targetYear.toString());

        const yearSpend = expenses
          .filter((e) => {
            const parsed = parseExpenseDate(e.date);
            return parsed && parsed.year === targetYear;
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        expenseData.push(yearSpend);
        incomeData.push(navamt * 12);
      }
    }

    return { labels, expenseData, incomeData };
  }, [expenses, trendRange, trendSubValue, navamt]);

  const trendData = {
    labels: trendChartData.labels,
    datasets: [
      {
        label: "Income Budget",
        data: trendChartData.incomeData,
        backgroundColor: "#10b981", // Emerald 500
        borderRadius: 4,
        barPercentage: 0.85,
        categoryPercentage: 0.85,
      },
      {
        label: "Actual Expense",
        data: trendChartData.expenseData,
        backgroundColor: "#f43f5e", // Rose 500
        borderRadius: 4,
        barPercentage: 0.85,
        categoryPercentage: 0.85,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { family: "Poppins, sans-serif", size: 9, weight: "bold" },
          color: "#94a3b8",
          boxWidth: 10,
        },
      },
      title: { display: false },
    },
    scales: {
      y: {
        display: true,
        grid: { color: "rgba(148, 163, 184, 0.05)" },
        ticks: { font: { size: 9 }, color: "#94a3b8" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: "#94a3b8" },
      },
    },
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
  };

  // Format Helper
  const formatCurrency = (val) =>
    `₹${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  // --- Render ---
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 font-sans bg-slate-50 dark:bg-slate-950 min-h-screen w-full text-slate-800 dark:text-slate-100 transition-colors"
    >
      {/* Date Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Financial Data Analytics
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Calendar size={16} className="text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </motion.div>

      {/* --- Stat Cards --- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* Monthly Budget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Monthly Budget
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
              {formatCurrency(navamt)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 group-hover:text-white transition-colors">
            <Wallet size={24} />
          </div>
        </div>

        {/* Monthly Spent */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Monthly Spent
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-rose-500 dark:text-rose-400">
              {formatCurrency(totalamt)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 group-hover:bg-rose-500 dark:group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <ArrowUpCircle size={24} />
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Remaining Balance
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-500 dark:text-emerald-400">
              {formatCurrency(remainingBalance)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <ArrowDownCircle size={24} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Main Content Left (2 Cols) --- */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Spending Trend Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Spending Trend
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {trendRange === "daily"
                    ? `Last 7 Days (Focus: ${trendSubValue})`
                    : trendRange === "weekly"
                      ? `Last 4 Weeks (Focus: ${trendSubValue})`
                      : trendRange === "monthly"
                        ? `Last 6 Months (Focus: ${trendSubValue})`
                        : `Last 3 Years (Focus: ${trendSubValue})`}
                </p>
              </div>

              {/* Compact Filters in Top-Right */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 shadow-sm self-start lg:self-center">
                {/* Timeframe Selector Pills */}
                <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
                  {[
                    { id: "yearly", label: "Year" },
                    { id: "monthly", label: "Month" },
                    { id: "weekly", label: "Week" },
                    { id: "daily", label: "Daily" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleRangeChange(tab.id)}
                      className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        trendRange === tab.id
                          ? "bg-teal-600 text-white font-bold"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-[1px] h-4 bg-slate-200 dark:bg-slate-800"></div>

                {/* Sub-option Selection Area */}
                <div className="flex items-center min-w-[90px]">
                  {trendRange === "daily" ? (
                    <input
                      type="date"
                      value={trendSubValue}
                      onChange={(e) => setTrendSubValue(e.target.value)}
                      className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded text-[9px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  ) : (
                    <select
                      value={trendSubValue}
                      onChange={(e) => setTrendSubValue(e.target.value)}
                      className="w-full px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded text-[9px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none focus:ring-1 focus:ring-teal-500 max-h-[30px]"
                    >
                      {(trendRange === "yearly"
                        ? ["2024", "2025", "2026"]
                        : trendRange === "monthly"
                          ? [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ]
                          : ["Week 1", "Week 2", "Week 3", "Week 4"]
                      ).map((subOpt) => (
                        <option
                          key={subOpt}
                          value={subOpt}
                          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        >
                          {subOpt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Chart (Now 100% width, preventing ChartJS squeezing) */}
            <div className="h-[220px] w-full mt-4">
              <Bar data={trendData} options={trendOptions} />
            </div>
          </motion.div>

          {/* Recent Transactions List */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex-1"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Transactions
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  Recent Activity
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/Transactions")}
                  className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30 hover:bg-teal-100/50 dark:hover:bg-teal-900/20 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  View All <ArrowRight size={12} />
                </button>
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                  <CreditCard size={20} />
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic text-xs">
                  No transactions found
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                        ${
                                          exp.category === "Food"
                                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                            : exp.category === "Transport"
                                              ? "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                                              : exp.category === "Shopping"
                                                ? "bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                                                : exp.category ===
                                                    "Entertainment"
                                                  ? "bg-pink-100 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400"
                                                  : exp.category === "Utilities"
                                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                      >
                        {exp.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {exp.title}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {exp.category} • {exp.date}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      -₹{parseFloat(exp.amount).toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* --- Sidebar Right (1 Col) --- */}
        <div className="flex flex-col gap-8">
          {/* Category Distribution */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Categories
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  {currentMonthName} Breakdown
                </p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950/20 p-2 rounded-lg text-teal-600 dark:text-teal-400">
                <PieIcon size={20} />
              </div>
            </div>
            <div className="h-[250px] flex items-center justify-center">
              {currentMonthExpenses.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                  No data available for this month
                </p>
              )}
            </div>

            {/* Category Spending Summary List */}
            {currentMonthExpenses.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
                  Category Spending Summary
                </h4>
                <div className="space-y-3.5">
                  {Object.entries(categoryTotals).map(([category, amount]) => {
                    const percentage =
                      totalamt > 0 ? (amount / totalamt) * 100 : 0;

                    // Simple helper to match color classes
                    let colorClass = "bg-slate-500";
                    if (category === "Food") colorClass = "bg-emerald-500";
                    else if (category === "Transport")
                      colorClass = "bg-blue-500";
                    else if (category === "Shopping")
                      colorClass = "bg-purple-500";
                    else if (category === "Entertainment")
                      colorClass = "bg-pink-500";
                    else if (category === "Utilities")
                      colorClass = "bg-amber-500";

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${colorClass}`}
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 dark:text-slate-200">
                              {formatCurrency(amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        {/* Miniature Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Daily Tips Banner */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="bg-teal-50 dark:bg-teal-950/20 w-fit p-2 rounded-lg mb-4">
                <Sparkles
                  size={20}
                  className="text-teal-600 dark:text-teal-400"
                />
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                Daily Tips
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed opacity-80">
                "Small daily savings add up to huge yearly results. Standardize
                your spending habits to unlock financial freedom!"
              </p>
            </div>
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 dark:bg-teal-950/10 rounded-full opacity-50 blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 dark:bg-purple-950/10 rounded-full opacity-50 blur-xl -ml-10 -mb-10"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
