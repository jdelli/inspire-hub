"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./Login"; // Make sure the path is correct
import Signup from "./Signup"; // Import the Signup component

const backgroundImages = [
  "/images/IMG_5268.jpg",
  "/images/IMG_5269.jpg",
  "/images/IMG_5270.jpg",
  "/images/IMG_5271.jpg",
  "/images/IMG_5272.jpg",
];

const Hero = () => {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false); // New state for Signup modal

  // Effect to change background image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Effect to check user authentication status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Handler for "Book a Visit" button click
  const handleBookVisitClick = () => {
    if (loadingAuth) {
      return;
    }

    if (user) {
      router.push("/main");
    } else {
      setShowLoginModal(true); // Open the login modal if not logged in
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const openLoginModal = () => {
    setShowSignupModal(false); // Close signup if open
    setShowLoginModal(true); // Open login
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
  };

  const openSignupModal = () => {
    setShowLoginModal(false); // Close login if open
    setShowSignupModal(true); // Open signup
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-inter">
      {/* Overlay for background images */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10">
        {/* Map through background images to create a carousel effect */}
        {backgroundImages.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Background ${index}`}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-50 z-[-1]" : "opacity-0"
            }`}
          />
        ))}

        {/* Content section: aligned horizontally on desktop, vertically on mobile */}
        <div className="flex flex-col md:flex-row items-center justify-between h-full px-6 md:px-16 relative z-20">
          {/* Text content and button container */}
          <div className="w-full md:w-1/2 text-white flex flex-col justify-center items-start text-left space-y-6">
            {/* Main heading */}
            <h1 className="mt-30 md:mt-0 text-4xl md:text-6xl font-bold leading-tight">
              Welcome Home to <br className="hidden md:block" /> Inspire Hub
            </h1>
            {/* Supporting paragraph */}
            <p className="text-lg md:text-2xl max-w-xl">
              The community, workspaces, and technology to make a good
              impression and get down to business.
            </p>
            {/* "Book a Visit" button */}
            <button
              onClick={handleBookVisitClick}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition duration-300 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Book a Visit
            </button>
          </div>
        </div>
      </div>

      {/* Conditional rendering of modals */}
      {showLoginModal && (
        <Login closeModal={closeLoginModal} showSignupModal={openSignupModal} />
      )}
      {showSignupModal && (
        <Signup closeModal={closeSignupModal} showLoginModal={openLoginModal} />
      )}
    </div>
  );
};

export default Hero;