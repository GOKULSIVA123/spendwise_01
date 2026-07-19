import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Expense from "./pages/Expense";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Budget from "./pages/Budget";
import Transactions from "./pages/Transactions";

function App() {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors closeButton />
      {/* 1. If user is signed out, show the beautiful separate signin/signup page */}
      <SignedOut>
        <AuthPage />
      </SignedOut>

      {/* 2. If user is signed in, give them full access to the main pages */}
      <SignedIn>
        <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-250">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <Navbar />
            <main className="flex-1 p-6 overflow-y-auto w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Expense" element={<Expense />} />
                <Route path="/Budget" element={<Budget />} />
                <Route path="/Transactions" element={<Transactions />} />
              </Routes>
            </main>
          </div>
        </div>
      </SignedIn>
    </HashRouter>
  );
}

export default App;
