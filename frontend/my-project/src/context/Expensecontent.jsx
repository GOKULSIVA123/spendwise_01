import { React, useContext, createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
export const Expensecontent = createContext(null);
export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const { getToken, isSignedIn } = useAuth();
  const fetchExpenses = async () => {
    try {
      const token = await getToken();
      const response = await axios.get("http://127.0.0.1:5000/api/expenses", {
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
