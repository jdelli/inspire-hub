"use client"; // Assuming you need this directive

import React, { useState, useEffect } from 'react';
import { db, auth } from "../../../../script/firebaseConfig";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  sendEmailVerification // Import sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SettingsPage = () => {
  // User profile state
  const [profile, setProfile] = useState({
    firstName: '', // Changed from 'name'
    lastName: '',  // New field
    email: '',
    phone: '', // Stored in Firestore
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email change state (for re-authentication)
  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: '',
    currentPasswordForEmail: '',
  });
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false); // New state for email verification status

  // --- Fetch User Data on Component Mount ---
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setLoading(true);
        try {
          const user = auth.currentUser;
          let currentProfile = {
            // Note: Firebase Auth's displayName isn't typically split into first/last.
            // You might manage this entirely in Firestore or parse displayName if it
            // contains both names (e.g., "John Doe" -> firstName: "John", lastName: "Doe").
            // For now, we'll try to populate from Firestore first, then fallback.
            firstName: '',
            lastName: '',
            email: user.email || '',
            phone: '',
          };

          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            currentProfile = {
              ...currentProfile,
              firstName: firestoreData.firstName || '',
              lastName: firestoreData.lastName || '',
              phone: firestoreData.phone || '',
            };
          } else {
            // If no Firestore data, try to parse from displayName if it exists
            if (user.displayName) {
              const nameParts = user.displayName.split(' ');
              currentProfile.firstName = nameParts[0] || '';
              currentProfile.lastName = nameParts.slice(1).join(' ') || '';
            }
          }
          setProfile(currentProfile);
          setEmailChangeData(prev => ({ ...prev, newEmail: prev.newEmail || user.email || '' }));
        } catch (error) {
          console.error("Error fetching user data:", error);
          setProfileError("Failed to load user data.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.log("No user logged in.");
      }
    };

    fetchUserData();
  }, []);

  // --- Handle Profile Changes (local state) ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target; // Removed type, checked as checkboxes are gone
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Handle Email Change (local state) ---
  const handleEmailChangeInput = (e) => {
    const { name, value } = e.target;
    setEmailChangeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Handle Password Changes (local state) ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Submit Profile Changes to Firebase ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaveMessage('');
    setProfileError('');

    if (!auth.currentUser) {
      setProfileError("No user logged in.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;

      // You can still update displayName in Firebase Auth if you want,
      // perhaps by combining firstName and lastName.
      await updateProfile(user, {
        displayName: `${profile.firstName} ${profile.lastName}`.trim()
      });

      // Update additional profile data in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        // Removed notifications and darkMode
      }, { merge: true });

      setProfileSaveMessage('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProfileSaveMessage('');
        setProfileError('');
      }, 3000);
    }
  };

  // --- Submit Email Change to Firebase ---
  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault();
    setEmailChangeError('');
    setEmailVerificationSent(false);
    setProfileSaveMessage('');

    if (!auth.currentUser) {
      setEmailChangeError("No user logged in.");
      return;
    }

    if (!emailChangeData.newEmail) {
      setEmailChangeError("New email cannot be empty.");
      return;
    }

    if (emailChangeData.newEmail === auth.currentUser.email) {
      setEmailChangeError("New email is the same as the current email.");
      return;
    }

    if (!emailChangeData.currentPasswordForEmail) {
      setEmailChangeError("Please enter your current password to change email.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, emailChangeData.currentPasswordForEmail);

      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, emailChangeData.newEmail);
      await sendEmailVerification(user);

      // Update the email field in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: emailChangeData.newEmail
      }, { merge: true });

      setProfile(prev => ({ ...prev, email: emailChangeData.newEmail }));

      setEmailVerificationSent(true);
      setEmailChangeData(prev => ({ ...prev, currentPasswordForEmail: '' }));
      setEmailChangeError('');

    } catch (error) {
      console.error("Error updating email:", error);
      setEmailChangeError(`Failed to update email: ${error.message}`);

      if (error.code === 'auth/operation-not-allowed') {
        setEmailChangeError("Email change requires verification. Please check the new email's inbox for a verification link.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setEmailChangeError("Incorrect current password.");
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailChangeError("The new email address is already in use by another account.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        setEmailChangeError('');
      }, 10000);
    }
  };

  // --- Submit Password Change to Firebase ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!auth.currentUser) {
      setPasswordError("No user logged in.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (!passwordData.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === 'auth/wrong-password') {
        setPasswordError("Incorrect current password.");
      } else if (error.code === 'auth/weak-password') {
        setPasswordError("New password is too weak. Please choose a stronger one.");
      } else {
        setPasswordError(`Failed to change password: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        setPasswordSuccess(false);
        setPasswordError('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-600">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Settings</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Information Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {profileError && (
              <div className="text-red-600 text-sm">{profileError}</div>
            )}
            {profileSaveMessage && (
              <div className="text-green-600 text-sm">{profileSaveMessage}</div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Email Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Email</h2>
          <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
              <input
                type="email"
                id="currentEmail"
                name="currentEmail"
                value={profile.email}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                disabled
              />
            </div>
            <div>
              <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
              <input
                type="email"
                id="newEmail"
                name="newEmail"
                value={emailChangeData.newEmail}
                onChange={handleEmailChangeInput}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="currentPasswordForEmail" className="block text-sm font-medium text-gray-700 mb-1">Current Password (for email change)</label>
              <input
                type="password"
                id="currentPasswordForEmail"
                name="currentPasswordForEmail"
                value={emailChangeData.currentPasswordForEmail}
                onChange={handleEmailChangeInput}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {emailChangeError && (
              <div className="text-red-600 text-sm">{emailChangeError}</div>
            )}
            {emailVerificationSent && (
              <div className="text-green-600 text-sm">
                A verification email has been sent to **{emailChangeData.newEmail}**.
                Please check your inbox and spam folder to verify the new email address and complete the change.
                You may need to log in again after successful verification.
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Change Email'}
              </button>
            </div>
          </form>
        </div>


        {/* Change Password Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            {passwordError && (
              <div className="text-red-600 text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="text-green-600 text-sm">Password changed successfully!</div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;