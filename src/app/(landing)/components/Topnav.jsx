'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Signup from '../components/Signup'; // Adjust paths as needed
import Login from '../components/Login';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../../../script/firebaseConfig'; // Import 'db' from your firebaseConfig
import { collection, getDocs, query, where } from 'firebase/firestore'; // Import Firestore functions
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; // Assuming you have react-toastify setup

// Importing Feather Icons for hamburger/close
// You'll need to install react-icons: npm install react-icons
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Topnav() {
  const [scrolled, setScrolled] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false); // Renamed for clarity
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Renamed for clarity
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Animation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for the mobile menu

  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("uid", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);

          let userProfileData = {};
          if (!querySnapshot.empty) {
            userProfileData = querySnapshot.docs[0].data();
          }

          setUser({
            ...currentUser,
            firstName: userProfileData.firstName || currentUser.displayName?.split(' ')[0] || '',
            lastName: userProfileData.lastName || currentUser.displayName?.split(' ').slice(1).join(' ') || '',
            role: userProfileData.role || 'user',
          });
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  // --- Modal Control Functions ---
  const openSignupModal = () => {
    setIsLoginModalOpen(false); // Close login modal if open
    setIsSignupModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening modal
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const openLoginModal = () => {
    setIsSignupModalOpen(false); // Close signup modal if open
    setIsLoginModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu when opening modal
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };
  // --- End Modal Control Functions ---

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    await new Promise((res) => setTimeout(res, 400)); // Simulate delay for animation
    try {
      await signOut(auth);
      setUser(null);
      toast.success("Logged out successfully!");
      router.push("/"); // Redirect after successful logout
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error(`Logout failed: ${error.message || "An unknown error occurred."}`);
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false); // Ensure menu closes
    }
  };

  const handleAdminClick = () => {
    router.push('/dashboard');
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 transition-opacity animate-fadeout">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-yellow-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-white text-lg font-bold">Logging out...</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={`w-full fixed top-0 left-0 z-50 px-6 py-4 flex items-center justify-between transition-colors duration-300 ${
          scrolled ? 'bg-[#2b2b2b] shadow-md' : 'bg-transparent'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/images/inspirelogo.png"
            alt="Website Logo"
            width={40}
            height={40}
          />
          <span className="text-white font-bold text-lg">Inspire Hub</span>
        </div>

        {/* Mobile Menu Button (Hamburger/X Icon) - visible only on md screens and below */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none text-xl sm:text-2xl"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Navigation Links (Desktop) - hidden on md screens and below */}
        <div className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              <span className="text-white font-semibold">
                Hello{' '}
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.displayName || user.email}
              </span>
              {user.role === "admin" && (
                <button
                  onClick={handleAdminClick}
                  className={`font-bold transition px-4 py-2 rounded
                    ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}
                  `}
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className={`font-bold transition ${
                  scrolled
                    ? 'bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-orange-600'
                    : 'text-white hover:text-blue-300'
                }`}
                disabled={isLoggingOut}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openSignupModal}
                className="text-white font-bold hover:text-blue-300 transition"
              >
                Sign up
              </button>
              <button
                onClick={openLoginModal}
                className={`font-bold transition ${
                  scrolled
                    ? 'bg-yellow-500 text-gray-900 px-4 py-2 rounded hover:bg-orange-600'
                    : 'text-white hover:text-blue-300'
                }`}
              >
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu - Under-the-Navbar Slide-Down */}
      <div
        className={`md:hidden fixed w-full top-[68px] z-40 shadow-lg
                     transition-transform duration-300 ease-out
                     ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                     ${scrolled ? 'bg-[#2b2b2b]' : 'bg-[#2b2b2b] shadow-md'}`}
      >
        <ul className="py-2 px-4 space-y-2">
          {user ? (
            <>
              <li>
                <span className="w-full block text-left py-2 px-3 rounded text-white text-lg font-semibold">
                  Hello{' '}
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName || user.email}
                </span>
              </li>
              {user.role === "admin" && (
                <li>
                  <button
                    onClick={handleAdminClick}
                    className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white font-bold"
                  >
                    Admin Panel
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white font-bold"
                  disabled={isLoggingOut}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  onClick={openSignupModal}
                  className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white font-bold"
                >
                  Sign up
                </button>
              </li>
              <li>
                <button
                  onClick={openLoginModal}
                  className="w-full block text-left py-2 px-3 rounded hover:bg-blue-700 transition-colors text-white font-bold"
                >
                  Login
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Render Signup Modal, passing both close and openLoginModal */}
      {isSignupModalOpen && (
        <Signup
          closeModal={closeSignupModal}
          showLoginModal={openLoginModal} // Pass function to open Login from Signup
        />
      )}

      {/* Render Login Modal, passing both close and openSignupModal */}
      {isLoginModalOpen && (
        <Login
          closeModal={closeLoginModal}
          showSignupModal={openSignupModal} // Pass function to open Signup from Login
        />
      )}

      {/* TailwindCSS keyframes for fadeout (add this to your global.css if not present):
      @keyframes fadeout {
        0% { opacity: 1; }
        100% { opacity: 0.5; }
      }
      .animate-fadeout {
        animation: fadeout 0.4s;
      }
      */}
    </>
  );
}