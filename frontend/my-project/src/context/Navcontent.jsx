import React, { createContext, useState, useEffect } from "react";
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

  useEffect(() => {
    localStorage.setItem("monthly_budget", navamt);
  }, [navamt]);

  useEffect(() => {
    localStorage.setItem("category_budgets", JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  const value = {
    navamt: navamt,
    setNavamt: setNavamt,
    target1: target1,
    setTarget1: setTarget1,
    categoryBudgets: categoryBudgets,
    setCategoryBudgets: setCategoryBudgets,
  };
  return <Navcontent.Provider value={value}>{children}</Navcontent.Provider>;
};
