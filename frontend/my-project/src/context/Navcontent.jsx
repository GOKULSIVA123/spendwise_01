import React, { createContext, useState, useEffect } from "react";
import { toast } from "sonner";
export const Navcontent = createContext(null);
export const NavProvider = ({ children }) => {
  const [navamt, setNavamt] = useState(() => {
    const saved = localStorage.getItem("monthly_budget");
    return saved ? parseFloat(saved) : 0;
  });
  const [target1, setTarget1] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    const saved = localStorage.getItem("category_budgets");
    return saved ? JSON.parse(saved) : {
      Food: 0,
      Transport: 0,
      Shopping: 0,
      Entertainment: 0,
      Utilities: 0,
      Other: 0,
    };
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("global_notifications");
    return saved ? JSON.parse(saved) : [
      { id: "1", text: "Welcome to SpendWise! Set up your Monthly Budget to begin logging expenses.", type: "info", timestamp: new Date().toISOString(), read: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem("monthly_budget", navamt);
  }, [navamt]);

  useEffect(() => {
    localStorage.setItem("category_budgets", JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  useEffect(() => {
    localStorage.setItem("global_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (text, type = "info") => {
    const newNotif = {
      id: crypto.randomUUID(),
      text,
      type, // 'info' | 'success' | 'warning' | 'error'
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Trigger Sonner toast popups
    if (type === "success") {
      toast.success(text);
    } else if (type === "error" || type === "warning") {
      toast.error(text);
    } else {
      toast(text);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    navamt: navamt,
    setNavamt: setNavamt,
    target1: target1,
    setTarget1: setTarget1,
    categoryBudgets: categoryBudgets,
    setCategoryBudgets: setCategoryBudgets,
    notifications: notifications,
    addNotification: addNotification,
    markAllNotificationsAsRead: markAllNotificationsAsRead,
    clearNotifications: clearNotifications,
  };
  return <Navcontent.Provider value={value}>{children}</Navcontent.Provider>;
};
