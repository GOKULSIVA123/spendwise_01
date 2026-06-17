import React, { useContext } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";
import { Navcontent } from "../context/Navcontent";
import { Expensecontent } from "../context/Expensecontent";
import Logo from "../assets/AuraSpend1.png";
function Navbar() {
  const { navamt, target1 } = useContext(Navcontent);
  const { expenses } = useContext(Expensecontent);
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();

  const totalamt = expenses.reduce((accum, current) => {
    const amt1 = parseFloat(current.amount) || 0;
    return amt1 + accum;
  }, 0);

  const amt2 = navamt - totalamt;

  const callBackend = async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;
      console.log(token);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("Backend /api/me:", data);
    } catch (err) {
      console.error("Error calling backend:", err);
    }
  };

  return (
    <div className="p-4 bg-indigo-500 dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center gap-2">
      <div className="flex flex-row items-center gap-2">
        <img
          src={Logo}
          alt="SpendWise Logo"
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
        />

        <h1 className="text-xl font-bold text-white md:w-auto w-full text-center md:text-left">
          SpendWise
        </h1>
      </div>
      {/* Right side: stats + theme + auth */}
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center items-center w-full md:w-auto">
        {/* Stats (hidden on very small screens) */}
        <div className="hidden sm:flex flex-row gap-4">
          <h1 className="bg-white px-3 py-1 rounded-lg text-sm font-medium">
            Target Days:
            <span className="text-gray-700 font-bold ml-2">{target1}</span>
          </h1>
          <h1 className="bg-white px-3 py-1 rounded-lg text-sm font-medium">
            Total:
            <span className="text-gray-700 font-bold ml-2">
              {amt2 > 0 ? amt2.toFixed(2) + "Rs" : "No Balance"}
            </span>
          </h1>
          <h3 className="text-gray-700 font-bold ml-2 bg-white px-3 py-1 rounded-lg text-sm">
            Spent: {totalamt.toFixed(2)}Rs
          </h3>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Auth buttons */}
        <SignedOut>
          <SignInButton className="px-3 py-1 bg-[#333333] text-white rounded-xl text-sm" />
          <SignUpButton className="px-3 py-1 bg-[#333333] text-white rounded-xl text-sm" />
        </SignedOut>

        <SignedIn>
          {/* Optional: test backend sync */}
          <button
            onClick={callBackend}
            className="px-3 py-1 bg-white text-gray-800 rounded-xl text-xs sm:text-sm mr-1"
          >
            Sync
          </button>

          <span className="text-white mr-2 text-sm">
            Welcome, {user?.fullName}
          </span>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
}

export default Navbar;
