import React, { useState, useContext, createContext } from "react";
import { motion } from "framer-motion";
import { useNavigate, BrowserRouter } from "react-router-dom";
import { 
  FileText, 
  DollarSign, 
  Tag, 
  Calendar, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  Wallet
} from "lucide-react";
import { Expensecontent } from "../context/Expensecontent";

function Expense() {
  const navigate = useNavigate();
  const { addExpense } = useContext(Expensecontent);
  const [formdata, setFormdata] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const handlechange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevdata) => ({ ...prevdata, [name]: value }));
  };

  const handlesubmit = (e) => {
    e.preventDefault();
    addExpense(formdata);
    setFormdata({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    navigate("/Dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-center items-center py-10"
    >
      <div className="w-full max-w-[550px] relative">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-20 -z-10"></div>

        <form
          onSubmit={handlesubmit}
          className="w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="relative z-10">
              <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
              <p className="text-indigo-100 text-xs mt-1 uppercase tracking-widest font-semibold opacity-80">
                SpendWise Tracker
              </p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Plus size={90} strokeWidth={1} />
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-6">
            
            {/* Expense Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText size={14} /> Expense Name
              </label>
              <input
                onChange={handlechange}
                value={formdata.title}
                type="text"
                name="title"
                placeholder="e.g.Groceries"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                required
              />
            </div>

            {/* Amount & Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center jus gap-2">
                   Amount
                </label>
                <div className="relative">
                  <input
                    onChange={handlechange}
                    value={formdata.amount}
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Tag size={14} /> Category
                </label>
                <select
                  onChange={handlechange}
                  value={formdata.category}
                  name="category"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer appearance-none"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={14} /> Date
              </label>
              <input
                onChange={handlechange}
                value={formdata.date}
                type="date"
                name="date"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare size={14} /> Notes (Optional)
              </label>
              <textarea
                onChange={handlechange}
                name="notes"
                value={formdata.notes}
                placeholder="Add a brief note..."
                rows="3"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium resize-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-100/50 hover:bg-indigo-600 transition-colors mt-4"
            >
              Log Transaction
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </form>

      </div>
    </motion.div>
  );
}

// Wrapper for preview functionality
export default Expense;