"use client";
import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Firebase imports (ensure these paths are correct for your project)
import { auth } from "../../../../script/auth";
import { signOut } from "firebase/auth";

// Toast Notification import (ensure ToastContainer is rendered in your app's root)
import { toast } from "react-toastify";

const Sidenav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();

  // No 'scrolled' state or its useEffect is needed anymore, as the header color is fixed.

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      // Engage Firebase signOut
      await signOut(auth);
      toast.success("Logged out successfully!");

      // Optional: Clear any local storage or cookies related to user session
      localStorage.removeItem('userToken'); // Example: if you store a user token
      console.log("User logged out from Firebase and local data cleared.");

      // Redirect to the homepage after logout
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(`Logout failed: ${error.message || "An unknown error occurred."}`);
    } finally {
      setIsMobileMenuOpen(false); // Ensure menu closes on logout
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-colors duration-300 bg-[#2b2b2b] shadow-md`}>
        {/* Logo flex left */}
        <div className="flex items-center space-x-2">
          <Image
            src="/images/icon24.png"
            alt="Website Logo"
            width={50}
            height={50}
          />
          <span className="text-white font-bold text-lg">Inspire Hub</span>
        </div>

        {/* Navigation buttons & Mobile Toggle - Flex right */}
        <div className="flex items-center space-x-6">
          {/* Desktop "Inquire Virtual Office" Button */}
          <Link
            href="/virtual"
            className="text-white font-semibold hover:text-blue-300 transition px-4 py-2 rounded-lg hidden md:block" // Hidden on mobile, shown on desktop
          >
            Inquire Virtual Office
          </Link>

          {/* Desktop Logout Button */}
          <button
            onClick={handleLogout}
            className="text-white font-semibold hover:text-blue-300 transition px-4 py-2 rounded-lg hidden md:block" // Hidden on mobile, shown on desktop
          >
            Logout
          </button>

          {/* Mobile Toggle Button (only visible on mobile) */}
          <button
            className="md:hidden text-white text-xl sm:text-2xl focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* Mobile Menu - Always rendered, controlled by CSS classes */}
      <div className={`md:hidden bg-[#1e293b] fixed w-full top-20 z-40 shadow-lg 
                       transition-transform duration-300 ease-out 
                       ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <ul className="py-2 px-4 space-y-2">
          <li>
            {/* Mobile "Inquire Virtual Office" Link */}
            <Link
              href="/virtual"
              className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white"
              onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
            >
              Inquire Virtual Office
            </Link>
          </li>
          <li>
            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidenav;