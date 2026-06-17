import React, { useContext, useState, createContext } from "react";
import { Link, useLocation, BrowserRouter } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Home,
  Target,
  Wallet,
} from "lucide-react";

import { Navcontent } from "../context/Navcontent";
function Sidebar() {
  const { setNavamt, setTarget1 } = useContext(Navcontent);
  const [totalamt, setTotalamt] = useState("");
  const [target, setTarget] = useState("");
  const location = useLocation();

  const handleSetBudget = (e) => {
    e.preventDefault();
    const newBudgetAmount = parseFloat(totalamt);
    if (isNaN(newBudgetAmount) || newBudgetAmount < 0) {
      return;
    }
    setNavamt(newBudgetAmount);
    setTotalamt("");
  };

  const handleSetGoal = (e) => {
    e.preventDefault();
    setTarget1(target);
    setTarget("");
  };

  // Helper for consistent link styling based on Canvas tokens
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass =
      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ";
    return isActive
      ? `${baseClass} text-indigo-600 bg-indigo-50`
      : `${baseClass} text-slate-500 hover:bg-slate-50 hover:text-indigo-600`;
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col p-6 gap-8 shadow-sm">
      {/* Brand Section */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Wallet size={20} />
        </div>
        <h2 className="font-bold text-xl text-slate-900 tracking-tight">
          SpendWise
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1">
        <Link to="/" className={getLinkClass("/")}>
          <Home size={20} />
          Home
        </Link>
        <Link to="/Dashboard" className={getLinkClass("/Dashboard")}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/Expense" className={getLinkClass("/Expense")}>
          <Receipt size={20} />
          Expenses
        </Link>
      </nav>

      <div className="h-px bg-slate-100 mx-2"></div>

      {/* Forms Section */}
      <div className="flex flex-col gap-6">
        {/* Set Budget Form */}
        <div className="flex flex-col gap-3 items-start">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            Set Total Budget
          </label>
          <input
            onChange={(e) => setTotalamt(e.target.value)}
            value={totalamt}
            type="number"
            placeholder="₹0.00"
            className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
          />
          <button
            onClick={handleSetBudget}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 "
          >
            Update Budget
          </button>
        </div>

        {/* Set Goal Form */}
        <div className="flex flex-col gap-3">
          <div className="px-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={14} /> Monthly Goal
            </label>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">
              Applies to full month of date picked
            </p>
          </div>
          <input
            onChange={(e) => setTarget(e.target.value)}
            value={target}
            type="date"
            className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
          />
          <button
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all"
            onClick={handleSetGoal}
          >
            Set Target
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="">
          <p className="text-xs font-bold text-slate-900 text-[22px]">
            SpendWise
          </p>
        </div>
      </div>
    </aside>
  );
}
export default Sidebar;
