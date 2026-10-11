import React, { useState, useRef, useContext } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  RefreshCw,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import { Expensecontent } from "../context/Expensecontent";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Other",
];

const DEMO_TRANSACTIONS = [
  {
    title: "Swiggy",
    amount: 340.0,
    category: "Food",
    date: "2026-10-05",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Shell Fuel Station",
    amount: 500.0,
    category: "Transport",
    date: "2026-10-06",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Amazon Marketplace",
    amount: 1299.0,
    category: "Shopping",
    date: "2026-10-07",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Chai Point",
    amount: 45.0,
    category: "Food",
    date: "2026-10-08",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Bescom Power Bill",
    amount: 1450.0,
    category: "Utilities",
    date: "2026-10-09",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Netflix Subscription",
    amount: 649.0,
    category: "Entertainment",
    date: "2026-10-10",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
  {
    title: "Zepto Quick Grocery",
    amount: 280.0,
    category: "Shopping",
    date: "2026-10-11",
    notes: "Imported via GPay Statement",
    is_duplicate: false,
  },
];

export default function GPayUploadModal({ isOpen, onClose }) {
  const { getToken } = useAuth();
  const { fetchExpenses } = useContext(Expensecontent);

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parsed candidates list for review
  const [transactions, setTransactions] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [step, setStep] = useState("upload"); // 'upload' | 'review'
  const [uploadError, setUploadError] = useState(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setTransactions([]);
    setSelectedIndices(new Set());
    setStep("upload");
    setUploadError(null);
    setIsLoading(false);
    setIsSubmitting(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const validExtensions = [".csv", ".txt", ".tsv", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      const errText = "Please upload a CSV, TXT, or PDF file.";
      setUploadError(errText);
      toast.error(errText);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setIsLoading(true);
    console.log(`📁 Uploading statement: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE_URL}/api/expenses/parse-gpay`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Parser response:", res.data);
      const parsedItems = res.data?.transactions || [];
      if (parsedItems.length === 0) {
        const noTxMsg = "No valid transactions found in this document.";
        setUploadError(noTxMsg);
        toast.error(noTxMsg);
        setIsLoading(false);
        return;
      }

      setTransactions(parsedItems);
      // Pre-select non-duplicates
      const initialSelected = new Set();
      parsedItems.forEach((item, idx) => {
        if (!item.is_duplicate) {
          initialSelected.add(idx);
        }
      });
      setSelectedIndices(initialSelected);
      setStep("review");
      toast.success(`Detected ${parsedItems.length} transactions from ${file.name}!`);
    } catch (err) {
      console.error("❌ Document parser error:", err);
      // Fallback: If backend is temporarily offline during dev or sample file is used
      if (file.name === "gpay_sample_statement.csv") {
        setTransactions(DEMO_TRANSACTIONS);
        setSelectedIndices(new Set(DEMO_TRANSACTIONS.map((_, i) => i)));
        setStep("review");
        toast.success("Loaded 7 sample transactions for preview!");
      } else {
        const errorDetail =
          err.response?.data?.detail ||
          err.message ||
          "Could not parse document. Please check the file format.";
        setUploadError(errorDetail);
        toast.error(errorDetail, { duration: 6000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Template Loader
  const handleLoadDemoStatement = () => {
    setTransactions(DEMO_TRANSACTIONS);
    setSelectedIndices(new Set(DEMO_TRANSACTIONS.map((_, i) => i)));
    setStep("review");
    toast.success("⚡ Loaded 7 sample GPay transactions for instant review!");
  };

  // Toggle row selection
  const toggleSelectRow = (idx) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Select / Deselect All
  const toggleSelectAll = () => {
    if (selectedIndices.size === transactions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(transactions.map((_, i) => i)));
    }
  };

  // Update category of a parsed item in review table
  const handleCategoryChange = (idx, newCategory) => {
    setTransactions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, category: newCategory } : item))
    );
  };

  // Confirm and Bulk Import
  const handleConfirmImport = async () => {
    const itemsToImport = transactions.filter((_, idx) => selectedIndices.has(idx));
    if (itemsToImport.length === 0) {
      toast.error("Please select at least one transaction to import.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        expenses: itemsToImport.map((item) => ({
          title: item.title,
          amount: parseFloat(item.amount),
          category: item.category,
          date: item.date,
          notes: item.notes || "Imported via GPay Statement",
        })),
      };

      const res = await axios.post(`${API_BASE_URL}/api/expenses/bulk-add`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const count = res.data?.imported_count || itemsToImport.length;
      toast.success(`🎉 Successfully imported ${count} transactions into SpendWise!`);

      // Refresh global context to update Dashboard charts and Transactions feed
      await fetchExpenses();
      handleReset();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail ||
        "Failed to save to SQLite. Please confirm your FastAPI backend is running with 'python run.py'."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Import Statement
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 rounded-full border border-teal-200 dark:border-teal-800">
                    UPI / GPay Parser
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Upload your Google Pay CSV or PDF to auto-extract & categorize transactions
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {step === "upload" ? (
              <div className="flex flex-col items-center">
                {/* Upload Error Banner */}
                {uploadError && (
                  <div className="w-full mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
                    <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Statement Parsing Failed</p>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">{uploadError}</p>
                    </div>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                      : "border-slate-200 dark:border-slate-700/80 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-950/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <RefreshCw size={36} className="text-teal-600 animate-spin" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Analyzing statement with Smart Categorizer...
                      </p>
                      <p className="text-xs text-slate-400">Classifying merchants & amounts</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3 text-teal-600 dark:text-teal-400">
                        <UploadCloud size={32} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        Drop your GPay Statement here, or <span className="text-teal-600 dark:text-teal-400 underline">browse</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Supports CSV exports and PDF transaction statements
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                        <span>CSV</span> • <span>PDF</span> • <span>UPI TXT</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Demo Test Option */}
                <div className="mt-5 flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-slate-400 font-medium">Don't have a statement on hand?</p>
                  <button
                    onClick={handleLoadDemoStatement}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer border border-teal-200 dark:border-teal-800/60"
                  >
                    <FileText size={14} /> Try Sample GPay Statement (7 transactions)
                  </button>
                </div>

                {/* Format Guidance Box */}
                <div className="mt-5 w-full bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 text-left">
                  <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    💡 Tips for PDF & CSV uploads:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Password Protection:</strong> If your bank statement is password-protected, open it in Chrome, press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Ctrl+P</kbd>, select <em>Save as PDF</em>, and upload the unlocked file.</li>
                    <li><strong>Selectable Text:</strong> Statements must have selectable text (not scanned images or camera photos).</li>
                    <li><strong>Google Pay CSV:</strong> CSV exports from Google Takeout / GPay are also fully supported.</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Review Table Step */
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Review Detected Transactions ({selectedIndices.size} selected of {transactions.length})
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check or uncheck items before saving to your SQLite database.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {selectedIndices.size === transactions.length ? "Deselect All" : "Select All"}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                    >
                      Upload Different File
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-8"></th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Merchant / Title</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((item, idx) => {
                        const isSelected = selectedIndices.has(idx);
                        return (
                          <tr
                            key={idx}
                            onClick={() => toggleSelectRow(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-teal-50/40 dark:bg-teal-950/20"
                                : "opacity-60 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                            }`}
                          >
                            <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRow(idx)}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">
                              {item.date}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span>{item.title}</span>
                                {item.is_duplicate && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800">
                                    Already Exists
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={item.category}
                                onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                              -₹{parseFloat(item.amount).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          {step === "review" && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="text-xs font-bold text-slate-500">
                Total to Import:{" "}
                <span className="text-slate-900 dark:text-white font-black text-sm">
                  ₹
                  {transactions
                    .filter((_, idx) => selectedIndices.has(idx))
                    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isSubmitting || selectedIndices.size === 0}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Importing to SQLite...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirm & Import {selectedIndices.size} Items
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
