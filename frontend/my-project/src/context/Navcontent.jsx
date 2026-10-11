import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const Navcontent = createContext(null);

export const DEFAULT_CATEGORIES = [
  {
    id: "Food",
    label: "Food",
    icon: "Utensils",
    color: "#10b981",
    bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    desc: "Restaurants, groceries, snacks & daily dining",
  },
  {
    id: "Transport",
    label: "Transport",
    icon: "Car",
    color: "#3b82f6",
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    desc: "Cab, metro, fuel, bus & flight tickets",
  },
  {
    id: "Shopping",
    label: "Shopping",
    icon: "ShoppingBag",
    color: "#a855f7",
    bg: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    desc: "Apparel, electronics, gadgets & lifestyle",
  },
  {
    id: "Entertainment",
    label: "Entertainment",
    icon: "Film",
    color: "#ec4899",
    bg: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400",
    desc: "Movies, concerts, OTT streaming & gaming",
  },
  {
    id: "Utilities",
    label: "Utilities",
    icon: "Zap",
    color: "#f59e0b",
    bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    desc: "Electricity, wi-fi, mobile recharges & rent",
  },
  {
    id: "Other",
    label: "Other",
    icon: "HelpCircle",
    color: "#64748b",
    bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    desc: "Miscellaneous & unexpected expenses",
  },
];

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

const getInitialWelcomeNotification = () => [
  {
    id: "1",
    text: "Welcome to SpendWise! Set up your Monthly Budget to begin logging expenses.",
    type: "info",
    timestamp: new Date().toISOString(),
    read: false,
  },
];

export const NavProvider = ({ children }) => {
  const { getToken, isSignedIn, userId } = useAuth();
  const [activeMonthKey, setActiveMonthKey] = useState(getCurrentMonthKey());
  const [target1, setTarget1] = useState(0);

  // Global user categories state
  const [userCategories, setUserCategories] = useState(() => {
    const saved = localStorage.getItem("spendwise_user_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user categories", e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(
      "spendwise_user_categories",
      JSON.stringify(userCategories),
    );
  }, [userCategories]);

  const addCustomCategory = (categoryObj) => {
    setUserCategories((prev) => {
      if (
        prev.some(
          (c) => c.id.toLowerCase() === categoryObj.id.toLowerCase(),
        )
      ) {
        return prev;
      }
      return [...prev, categoryObj];
    });
    addNotification(
      `Category "${categoryObj.label}" added successfully!`,
      "success",
    );
  };

  const deleteCustomCategory = (catId) => {
    setUserCategories((prev) => prev.filter((c) => c.id !== catId));
    addNotification(`Category removed.`, "info");
  };

  // State isolated per user
  const [monthlyBudgets, setMonthlyBudgets] = useState({
    [getCurrentMonthKey()]: {
      income: 0,
      categories: { ...DEFAULT_CATEGORY_BUDGETS },
    },
  });

  const [notifications, setNotifications] = useState(getInitialWelcomeNotification());

  // Whenever the logged-in user changes (or signs out), reset and load THAT user's data
  useEffect(() => {
    if (!userId) {
      // User signed out: reset state completely
      setMonthlyBudgets({
        [getCurrentMonthKey()]: {
          income: 0,
          categories: { ...DEFAULT_CATEGORY_BUDGETS },
        },
      });
      setNotifications(getInitialWelcomeNotification());
      return;
    }

    // 1. Try loading from user-scoped localStorage cache
    const cachedBudgets = localStorage.getItem(`spendwise_budgets_${userId}`);
    if (cachedBudgets) {
      try {
        setMonthlyBudgets(JSON.parse(cachedBudgets));
      } catch (e) {}
    } else {
      setMonthlyBudgets({
        [getCurrentMonthKey()]: {
          income: 0,
          categories: { ...DEFAULT_CATEGORY_BUDGETS },
        },
      });
    }

    const cachedNotifs = localStorage.getItem(`spendwise_notifications_${userId}`);
    if (cachedNotifs) {
      try {
        setNotifications(JSON.parse(cachedNotifs));
      } catch (e) {}
    } else {
      setNotifications(getInitialWelcomeNotification());
    }

    // 2. Fetch fresh user data from SQLite backend
    fetchBackendData(userId);
  }, [userId]);

  // Sync state to user-scoped localStorage
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`spendwise_budgets_${userId}`, JSON.stringify(monthlyBudgets));
    }
  }, [monthlyBudgets, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`spendwise_notifications_${userId}`, JSON.stringify(notifications));
    }
  }, [notifications, userId]);

  // Fetch budgets & notifications from SQLite backend for the specific user
  const fetchBackendData = async (activeUserId) => {
    try {
      const token = await getToken();
      if (!token) return;

      // 1. Fetch all monthly budgets from SQLite for this user
      const budgetRes = await axios.get(`${API_BASE_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetsList = budgetRes.data?.budgets || [];
      const budgetMap = {
        [getCurrentMonthKey()]: {
          income: 0,
          categories: { ...DEFAULT_CATEGORY_BUDGETS },
        },
      };

      budgetsList.forEach((b) => {
        budgetMap[b.month] = {
          income: parseFloat(b.income) || 0,
          categories: {
            ...DEFAULT_CATEGORY_BUDGETS,
            ...(b.categories || {}),
          },
        };
      });

      // Verify the active user hasn't switched mid-request
      if (activeUserId === userId) {
        setMonthlyBudgets(budgetMap);
        console.log(`✅ Budgets synchronized for user ${activeUserId}:`, budgetMap);
      }

      // 2. Fetch notifications from SQLite for this user
      const notifRes = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notifList = notifRes.data?.notifications;

      if (activeUserId === userId) {
        if (Array.isArray(notifList) && notifList.length > 0) {
          setNotifications(notifList);
        } else {
          // If new user has no notifications in DB, set clean welcome notification
          setNotifications(getInitialWelcomeNotification());
        }
        console.log(`✅ Notifications synchronized for user ${activeUserId}:`, notifList);
      }
    } catch (err) {
      console.warn("Backend sync fallback to user cache:", err.message);
    }
  };

  // Helper to fetch budget for a specified month key (e.g. "2026-10")
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
        categories: {
          ...DEFAULT_CATEGORY_BUDGETS,
          ...(monthlyBudgets[latestAvailableKey]?.categories || {}),
        },
        isInherited: true,
      };
    }
    return {
      income: 0,
      categories: { ...DEFAULT_CATEGORY_BUDGETS },
      isInherited: false,
    };
  };

  // Save budget for a specified month key and sync to SQLite backend
  const saveBudgetForMonth = async (monthKey, { income, categories }) => {
    const formattedCategories = {
      Food: parseFloat(categories?.Food) || 0,
      Transport: parseFloat(categories?.Transport) || 0,
      Shopping: parseFloat(categories?.Shopping) || 0,
      Entertainment: parseFloat(categories?.Entertainment) || 0,
      Utilities: parseFloat(categories?.Utilities) || 0,
      Other: parseFloat(categories?.Other) || 0,
    };
    const parsedIncome = parseFloat(income) || 0;

    // Optimistic local state update
    setMonthlyBudgets((prev) => ({
      ...prev,
      [monthKey]: {
        income: parsedIncome,
        categories: formattedCategories,
      },
    }));

    // Sync to SQLite backend
    try {
      const token = await getToken();
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/budget`,
          {
            month: monthKey,
            income: parsedIncome,
            categories: formattedCategories,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        console.log(`✅ Budget for ${monthKey} saved to SQLite backend.`);
      }
    } catch (err) {
      console.error("Failed to persist budget to backend:", err);
    }
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
      categories:
        typeof newCategories === "function"
          ? newCategories(categoryBudgets)
          : newCategories,
    });
  };

  const addNotification = async (text, type = "info") => {
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

    // Sync to SQLite backend
    try {
      const token = await getToken();
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/notifications`,
          { text, type },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }
    } catch (err) {
      console.warn("Failed to save notification to backend:", err.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      const token = await getToken();
      if (token) {
        await axios.delete(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn("Failed to clear notifications on backend:", err.message);
    }
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
    userCategories,
    addCustomCategory,
    deleteCustomCategory,
  };

  return <Navcontent.Provider value={value}>{children}</Navcontent.Provider>;
};
