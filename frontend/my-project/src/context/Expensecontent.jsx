import { React, useContext, createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const Expensecontent = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const { getToken, isSignedIn, userId } = useAuth();

  const fetchExpenses = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.warn("No auth token available yet.");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Handle both { expenses: [...] } and direct array [...] responses safely
      const data = response.data;
      const expenseList = Array.isArray(data)
        ? data
        : Array.isArray(data?.expenses)
        ? data.expenses
        : [];

      setExpenses(expenseList);
      console.log("✅ Fetched expenses from backend:", expenseList);
    } catch (e) {
      console.error("❌ Failed to fetch expenses:", e);
      setExpenses([]); // Keep expenses as empty array on failure
    }
  };

  useEffect(() => {
    // Immediately clear previous user's expenses to avoid state contamination
    setExpenses([]);
    if (userId) {
      fetchExpenses();
    }
  }, [userId]);

  const addExpense = async (newExpenses1) => {
    try {
      const token = await getToken();
      const payload = {
        title: newExpenses1.title,
        amount: parseFloat(newExpenses1.amount) || 0,
        category: newExpenses1.category,
        date: newExpenses1.date,
        notes: newExpenses1.notes || "",
      };

      if (token) {
        const response = await axios.post(`${API_BASE_URL}/api/expenses`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const savedExpense = response.data?.expense || response.data;
        setExpenses((prev) => [savedExpense, ...prev]);
        console.log("✅ Expense saved to SQLite backend:", savedExpense);
        return savedExpense;
      } else {
        // Fallback for unauthenticated dev test
        const localExpense = { ...payload, id: crypto.randomUUID(), _id: crypto.randomUUID() };
        setExpenses((prev) => [localExpense, ...prev]);
        return localExpense;
      }
    } catch (e) {
      console.error("❌ Error saving expense to backend:", e);
      // Fallback local update so user doesn't lose current view
      const fallbackExpense = {
        ...newExpenses1,
        id: crypto.randomUUID(),
        _id: crypto.randomUUID(),
      };
      setExpenses((prev) => [fallbackExpense, ...prev]);
      return fallbackExpense;
    }
  };

  const deleteExpense = async (id) => {
    try {
      const token = await getToken();
      if (token && id) {
        await axios.delete(`${API_BASE_URL}/api/expenses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setExpenses((prev) => prev.filter((item) => item.id !== id && item._id !== id));
      console.log("✅ Expense deleted:", id);
    } catch (e) {
      console.error("❌ Error deleting expense:", e);
    }
  };

  const value = {
    expenses: expenses,
    addExpense: addExpense,
    deleteExpense: deleteExpense,
    fetchExpenses: fetchExpenses,
  };

  return (
    <Expensecontent.Provider value={value}>{children}</Expensecontent.Provider>
  );
};
