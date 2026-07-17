import React, { createContext, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Expense from "./pages/Expense";

import Dashboard from "./pages/Dashboard";
import Home from "./pages/HomePage";
function App() {
  return (
    <HashRouter>
      <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-250">
        <Sidebar></Sidebar>
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Navbar></Navbar>
          <main className="flex-1 p-6 overflow-y-auto w-full">
            <Routes>
              <Route path="/" element={<Home></Home>}></Route>
              <Route
                path="/Dashboard"
                element={<Dashboard></Dashboard>}
              ></Route>
              <Route path="/Expense" element={<Expense></Expense>}></Route>
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
