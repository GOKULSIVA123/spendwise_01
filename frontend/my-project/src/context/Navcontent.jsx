import React, { createContext, useState, useEffect } from "react";
import { toast } from "sonner";

export const Navcontent = createContext(null);

const DEFAULT_CATEGORY_BUDGETS = {
  Food: 0,
  Transport: 0,
  Shopping: 0,
  Entertainment: 0,
  Utilities: 0,
  Other: 0,
};

const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const NavProvider = ({ children }) => {
  const [activeMonthKey, setActiveMonthKey] = useState(getCurrentMonthKey());
  const [target1, setTarget1] = useState(0);

  // Month-keyed storage for budgets: { "2026-09": { income: 50000, categories: { Food: 10000, ... } } }
  const [monthlyBudgets, setMonthlyBudgets] = useState(() => {
    const saved = localStorage.getItem("monthly_budgets_by_month");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved monthly_budgets_by_month", e);
      }
    }

    // Auto-migration from legacy single-month keys
    const currentMonthKey = getCurrentMonthKey();
    const oldIncome = localStorage.getItem("monthly_budget");
    const oldCategory = localStorage.getItem("category_budgets");

    let initialIncome = oldIncome ? parseFloat(oldIncome) : 0;
    let initialCategories = DEFAULT_CATEGORY_BUDGETS;

    if (oldCategory) {
      try {
        initialCategories = { ...DEFAULT_CATEGORY_BUDGETS, ...JSON.parse(oldCategory) };
      } catch (e) {
        console.error("Failed to parse old category_budgets", e);
      }
    }

    return {
      [currentMonthKey]: {
        income: initialIncome,
        categories: initialCategories,
      },
    };
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("global_notifications");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            text: "Welcome to SpendWise! Set up your Monthly Budget to begin logging expenses.",
            type: "info",
            timestamp: new Date().toISOString(),
            read: false,
          },
        ];
  });

  // Sync monthlyBudgets object to localStorage
  useEffect(() => {
    localStorage.setItem("monthly_budgets_by_month", JSON.stringify(monthlyBudgets));
  }, [monthlyBudgets]);

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem("global_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Helper to fetch budget for a specified month key (e.g. "2026-09")
  const getBudgetForMonth = (monthKey) => {
    if (monthlyBudgets[monthKey]) {
      return monthlyBudgets[monthKey];
    }
    // Fallback: inherit settings from the most recently configured month
    const sortedMonthKeys = Object.keys(monthlyBudgets).sort();
    if (sortedMonthKeys.length > 0) {
      const latestAvailableKey = sortedMonthKeys[sortedMonthKeys.length - 1];
      return {
        income: monthlyBudgets[latestAvailableKey]?.income || 0,
        categories: { ...DEFAULT_CATEGORY_BUDGETS, ...(monthlyBudgets[latestAvailableKey]?.categories || {}) },
        isInherited: true,
      };
    }
    return {
      income: 0,
      categories: { ...DEFAULT_CATEGORY_BUDGETS },
      isInherited: false,
    };
  };

  // Helper to save budget for a specified month key (e.g. "2026-09")
  const saveBudgetForMonth = (monthKey, { income, categories }) => {
    setMonthlyBudgets((prev) => ({
      ...prev,
      [monthKey]: {
        income: parseFloat(income) || 0,
        categories: {
          Food: parseFloat(categories?.Food) || 0,
          Transport: parseFloat(categories?.Transport) || 0,
          Shopping: parseFloat(categories?.Shopping) || 0,
          Entertainment: parseFloat(categories?.Entertainment) || 0,
          Utilities: parseFloat(categories?.Utilities) || 0,
          Other: parseFloat(categories?.Other) || 0,
        },
      },
    }));
  };

  // Reactive values for current active month
  const activeMonthData = getBudgetForMonth(activeMonthKey);
  const navamt = activeMonthData.income;
  const categoryBudgets = activeMonthData.categories;

  const setNavamt = (newIncome) => {
    saveBudgetForMonth(activeMonthKey, {
      income: newIncome,
      categories: categoryBudgets,
    });
  };

  const setCategoryBudgets = (newCategories) => {
    saveBudgetForMonth(activeMonthKey, {
      income: navamt,
      categories: typeof newCategories === "function" ? newCategories(categoryBudgets) : newCategories,
    });
  };

  const addNotification = (text, type = "info") => {
    const newNotif = {
      id: crypto.randomUUID(),
      text,
      type, // 'info' | 'success' | 'warning' | 'error'
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (type === "success") {
      toast.success(text);
    } else if (type === "error" || type === "warning") {
      toast.error(text);
    } else {
      toast(text);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    navamt,
    setNavamt,
    target1,
    setTarget1,
    categoryBudgets,
    setCategoryBudgets,
    monthlyBudgets,
    activeMonthKey,
    setActiveMonthKey,
    getBudgetForMonth,
    saveBudgetForMonth,
    notifications,
    addNotification,
    markAllNotificationsAsRead,
    clearNotifications,
  };

  return <Navcontent.Provider value={value}>{children}</Navcontent.Provider>;
};
