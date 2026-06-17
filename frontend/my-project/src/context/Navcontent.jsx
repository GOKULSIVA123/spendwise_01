import React, { createContext, useState } from "react";
export const Navcontent = createContext(null);
export const NavProvider = ({ children }) => {
  const [navamt, setNavamt] = useState(0);
  const [target1, setTarget1] = useState(0);
  const value = {
    navamt: navamt,
    setNavamt: setNavamt,
    target1: target1,
    setTarget1: setTarget1,
  };
  return <Navcontent.Provider value={value}>{children}</Navcontent.Provider>;
};
