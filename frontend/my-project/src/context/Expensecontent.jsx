import { React, useContext, createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Expensecontent = createContext(null);
export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const { getToken, isSignedIn } = useAuth();
  const fetchExpenses = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/expenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setExpenses(response.data);
      console.log("expenses", response.data);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    fetchExpenses();
  }, [isSignedIn]);
  const addExpense = (newExpenses1) => {
    const newExpenses = {
      ...newExpenses1,
      id: crypto.randomUUID(),
    };
    setExpenses((prev) => [newExpenses, ...prev]);
  };

  const value = {
    expenses: expenses,
    addExpense: addExpense,
    fetchExpenses: fetchExpenses,
  };
  return (
    <Expensecontent.Provider value={value}>{children}</Expensecontent.Provider>
  );
};
