import React, { useContext, useMemo } from "react";
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
} from "lucide-react";

// --- 1. Register ChartJS Components ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const { expenses } = useContext(Expensecontent);
  const { navamt } = useContext(Navcontent);

  // --- 2. CALCULATIONS ---
  const totalamt = expenses.reduce((accum, curr) => {
    return accum + (parseFloat(curr.amount) || 0);
  }, 0);

  const remainingBalance = navamt - totalamt;

  const categoryTotals = expenses.reduce((acc, curr) => {
    const cat = curr.category || "Other";
    const amt = parseFloat(curr.amount) || 0;
    acc[cat] = (acc[cat] || 0) + amt;
    return acc;
  }, {});

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);

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
    (expense) => expense.date === new Date().toISOString().slice(0, 10)
  );

  // D) Last 7 Days Trend
  const last7DaysData = useMemo(() => {
    const todayDate = new Date();
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      labels.push(dayLabel);

      const daySpend = expenses
        .filter((e) => e.date === dateStr)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      data.push(daySpend);
    }
    return { labels, data };
  }, [expenses]);

  const trendData = {
    labels: last7DaysData.labels,
    datasets: [
      {
        label: "Daily Spend",
        data: last7DaysData.data,
        backgroundColor: "#22c55e",
        borderRadius: 6,
        barThickness: 12,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { display: false },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
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
      className="p-6 font-sans bg-slate-50 min-h-screen w-full"
    >
      {/* Date Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Financial Data Analytics
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
          <Calendar size={16} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-600">
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
        {/* Total Budget */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Total Budget
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-indigo-600">
              {formatCurrency(navamt)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Wallet size={24} />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Total Spent
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-rose-500">
              {formatCurrency(totalamt)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <ArrowUpCircle size={24} />
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:shadow-md">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Remaining
            </h3>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-500">
              {formatCurrency(remainingBalance)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <ArrowDownCircle size={24} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Main Content Left (2 Cols) --- */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Last 7 Days Trend */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Weekly Trend
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Last 7 Days Spending
                </p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="h-[200px] w-full">
              <Bar data={trendData} options={trendOptions} />
            </div>
          </motion.div>

          {/* Recent Transactions List */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex-1"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Transactions
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Recent Activity
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg text-slate-600">
                <CreditCard size={20} />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">
                  No transactions found
                </div>
              ) : (
                expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                        ${
                                          exp.category === "Food"
                                            ? "bg-orange-100 text-orange-600"
                                            : exp.category === "Transport"
                                              ? "bg-blue-100 text-blue-600"
                                              : "bg-indigo-100 text-indigo-600"
                                        }`}
                      >
                        {exp.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {exp.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {exp.category} • {exp.date}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900">
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
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Categories</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  All Time Breakdown
                </p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <PieIcon size={20} />
              </div>
            </div>
            <div className="h-[250px] flex items-center justify-center">
              {expenses.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <p className="text-xs text-slate-400 font-medium text-center">
                  No data available
                </p>
              )}
            </div>
          </motion.div>

          {/* Daily Tips Banner */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="bg-indigo-50 w-fit p-2 rounded-lg mb-4">
                <Sparkles size={20} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-900">
                Daily Tips
              </h2>
              <p className="text-slate-500 text-xs font-medium leading-relaxed opacity-80">
                "Small daily savings add up to huge yearly results. Standardize
                your spending habits to unlock financial freedom!"
              </p>
            </div>
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full opacity-50 blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 rounded-full opacity-50 blur-xl -ml-10 -mb-10"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
