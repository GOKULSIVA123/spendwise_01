import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Expensecontent } from "../context/Expensecontent";
import { Navcontent } from "../context/Navcontent";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
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

// Category Color Palette for Charts & UI
const CATEGORY_COLORS = {
  Food: "#10b981", // Emerald 500
  Transport: "#3b82f6", // Blue 500
  Shopping: "#a855f7", // Purple 500
  Entertainment: "#ec4899", // Pink 500
  Utilities: "#f59e0b", // Amber 500
  Other: "#64748b", // Slate 500
};

const formatCurrency = (val) =>
  `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

// --- Custom Recharts Tooltip for Trend Bar Chart ---
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === "income")?.value || 0;
    const expense = payload.find((p) => p.dataKey === "expense")?.value || 0;
    const net = income - expense;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-xs font-sans space-y-2 min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {label}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              net >= 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
            }`}
          >
            {net >= 0 ? "Under" : "Over"}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Budget:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              Spent:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(expense)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- Custom Recharts Tooltip for Category Donut Chart ---
const CustomPieTooltip = ({ active, payload, totalSpent }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percentage =
      totalSpent > 0 ? ((data.value / totalSpent) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-400">
          <span className="font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(data.value)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            ({percentage}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const navigate = useNavigate();
  const { expenses: rawExpenses } = useContext(Expensecontent);
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];
  const { navamt, getBudgetForMonth } = useContext(Navcontent);
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

  // --- CALCULATIONS ---
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

  // Recharts Donut Data
  const pieChartData = useMemo(() => {
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#64748b",
    }));
  }, [categoryTotals]);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long" });
  }, []);

  // Filtered Expenses for Transactions List
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
        const expTs = new Date(
          parsed.year,
          parsed.month,
          parsed.day,
        ).getTime();
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
      const targetMonthIndex = monthNames.indexOf(trendSubValue);
      if (targetMonthIndex !== -1) {
        return expenses.filter((e) => {
          const parsed = parseExpenseDate(e.date);
          return (
            parsed &&
            parsed.month === targetMonthIndex &&
            parsed.year === new Date().getFullYear()
          );
        });
      }
    }

    if (trendRange === "yearly") {
      const targetYear = parseInt(trendSubValue);
      return expenses.filter((e) => {
        const parsed = parseExpenseDate(e.date);
        return parsed && parsed.year === targetYear;
      });
    }

    return expenses;
  }, [expenses, trendRange, trendSubValue]);

  // Recharts Multi-option Trend Data (Daily, Weekly, Monthly, Yearly)
  const rechartsTrendData = useMemo(() => {
    const todayDate = new Date();
    const data = [];

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

        const dayMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const dayBudgetObj = getBudgetForMonth(dayMonthKey);

        data.push({
          name: dayLabel,
          income: dayBudgetObj.income,
          expense: daySpend,
        });
      }
    } else if (trendRange === "weekly") {
      for (let i = 3; i >= 0; i--) {
        const startDay = new Date();
        startDay.setDate(todayDate.getDate() - (i * 7 + 6));
        const endDay = new Date();
        endDay.setDate(todayDate.getDate() - i * 7);

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

        const weekMonthKey = `${endDay.getFullYear()}-${String(endDay.getMonth() + 1).padStart(2, "0")}`;
        const weekBudgetObj = getBudgetForMonth(weekMonthKey);

        data.push({
          name: `Week ${4 - i}`,
          income: weekBudgetObj.income,
          expense: weekSpend,
        });
      }
    } else if (trendRange === "monthly") {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(todayDate.getMonth() - i);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

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

        const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
        const monthBudgetObj = getBudgetForMonth(monthKey);

        data.push({
          name: monthLabel,
          income: monthBudgetObj.income,
          expense: monthSpend,
        });
      }
    } else if (trendRange === "yearly") {
      for (let i = 2; i >= 0; i--) {
        const targetYear = todayDate.getFullYear() - i;

        const yearSpend = expenses
          .filter((e) => {
            const parsed = parseExpenseDate(e.date);
            return parsed && parsed.year === targetYear;
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        let yearBudgetTotal = 0;
        for (let m = 1; m <= 12; m++) {
          const mKey = `${targetYear}-${String(m).padStart(2, "0")}`;
          yearBudgetTotal += getBudgetForMonth(mKey).income;
        }

        data.push({
          name: targetYear.toString(),
          income: yearBudgetTotal,
          expense: yearSpend,
        });
      }
    }

    return data;
  }, [expenses, trendRange, trendSubValue, getBudgetForMonth]);

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
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <ArrowDownCircle size={24} />
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Remaining Balance
            </h3>
            <p
              className={`text-3xl font-extrabold tracking-tight ${
                remainingBalance >= 0
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-amber-500 dark:text-amber-400"
              }`}
            >
              {formatCurrency(remainingBalance)}
            </p>
          </div>
          <div
            className={`p-4 rounded-2xl transition-colors ${
              remainingBalance >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                : "bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white"
            }`}
          >
            <ArrowUpCircle size={24} />
          </div>
        </div>
      </motion.div>

      {/* --- Main Dashboard Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Main Chart & Activity (2 Cols) --- */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Multi-Option Trend Chart (Recharts) */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Analytics & Trends
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                  Budget vs. Actual Spending
                </p>
              </div>

              {/* Timeframe & Nested Scope Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-1 rounded-xl flex items-center gap-1 border border-slate-100 dark:border-slate-800/80">
                  {["daily", "weekly", "monthly", "yearly"].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleRangeChange(range)}
                      className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        trendRange === range
                          ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                {/* Sub-selector Filter */}
                <div className="bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center">
                  {trendRange === "daily" ? (
                    <input
                      type="date"
                      value={trendSubValue}
                      onChange={(e) => setTrendSubValue(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
                    />
                  ) : trendRange === "yearly" ? (
                    <select
                      value={trendSubValue}
                      onChange={(e) => setTrendSubValue(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1"
                    >
                      {[
                        new Date().getFullYear().toString(),
                        (new Date().getFullYear() - 1).toString(),
                        (new Date().getFullYear() - 2).toString(),
                      ].map((yr) => (
                        <option
                          key={yr}
                          value={yr}
                          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                        >
                          {yr}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={trendSubValue}
                      onChange={(e) => setTrendSubValue(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1"
                    >
                      {(trendRange === "monthly"
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

            {/* Recharts Bar Chart */}
            <div className="h-[240px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rechartsTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <RechartsTooltip content={<CustomTrendTooltip />} />
                  <RechartsLegend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      paddingBottom: "12px",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income Budget"
                    fill="url(#incomeGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="expense"
                    name="Actual Expense"
                    fill="url(#expenseGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
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
          {/* Category Distribution (Recharts Donut) */}
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

            <div className="h-[240px] relative flex items-center justify-center">
              {pieChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        content={<CustomPieTooltip totalSpent={totalamt} />}
                      />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={85}
                        paddingAngle={4}
                        cornerRadius={6}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Summary */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Total
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      {formatCurrency(totalamt)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
                  No data available for this month
                </p>
              )}
            </div>

            {/* Category Spending Summary List */}
            {currentMonthExpenses.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Category Spending Summary
                </h4>
                <div className="space-y-3.5">
                  {Object.entries(categoryTotals).map(([category, amount]) => {
                    const percentage =
                      totalamt > 0 ? (amount / totalamt) * 100 : 0;
                    const catColor = CATEGORY_COLORS[category] || "#64748b";

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: catColor }}
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
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: catColor,
                            }}
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
