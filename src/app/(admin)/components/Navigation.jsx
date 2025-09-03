'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../../script/firebaseConfig';

// MUI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    router.push('/');
  };

  // Hide navbar entirely for users without permission (not logged in or no role or role: "client")
  if (loading) return null;
  if (!user || !role || role === "client") return null;

  // Hide some links for non-admin
  const showTenants = role === "admin";
  const showReports = role === "admin";
  const showSettings = role === "admin";
  const showBilling = role === "admin";

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 px-6 py-4 flex items-center justify-between bg-blue-900 shadow-md">
        {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/icon24.png"
              alt="Website Logo"
              width={50}
              height={50}
            />
            <span className="text-white font-bold text-lg">Inspire Hub</span>
          </div>
        </div>

        {/* Right: Navigation links */}
        <div className="flex space-x-6 items-center">
          {/* Dashboard Links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link
              href="/dashboard"
              className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
            >
              <DashboardIcon fontSize="small" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/schedvisit"
              className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
            >
              <GroupIcon fontSize="small" />
              <span>Schedule Visit</span>
            </Link>
            <Link
              href="/meetingroomreceiving"
              className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
            >
              <MeetingRoomIcon fontSize="small" />
              <span>Meeting Room</span>
            </Link>
            {showTenants && (
              <Link
                href="/tenants"
                className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
              >
                <EventIcon fontSize="small" />
                <span>Tenants</span>
              </Link>
            )}
            {showReports && (
              <Link
                href="/reports"
                className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
              >
                <AssessmentIcon fontSize="small" />
                <span>Reports</span>
              </Link>
            )}
            {showBilling && (
              <Link
                href="/billing"
                className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
              >
                <AttachMoneyIcon fontSize="small" />
                <span>Billing</span>
              </Link>
            )}
            <Link
              href="/seatmap"
              className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
            >
              <MapIcon fontSize="small" />
              <span>Map</span>
            </Link>
            {showSettings && (
              <Link
                href="/settings"
                className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
              >
                <SettingsIcon fontSize="small" />
                <span>Settings</span>
              </Link>
            )}
          </div>

          {/* Account Links */}
          <div className="hidden md:flex space-x-6 items-center ml-4">
            <button
              onClick={handleLogout}
              className="text-white font-bold hover:text-blue-300 transition flex items-center space-x-2"
            >
              <LogoutIcon fontSize="small" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}