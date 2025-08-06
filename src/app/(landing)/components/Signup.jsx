'use client';
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { auth, db } from '../../../../script/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Signup({ closeModal, showLoginModal }) { // Added showLoginModal prop
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    setLoading(true); // Show loading spinner
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              uid: firebaseUser.uid,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              companyName: formData.companyName,
              contact: formData.contact,
              createdAt: new Date(),
              role: 'client'
            });

            setSuccessMessage('Registration successful!');
            setErrorMessage('');

            setTimeout(() => {
              setSuccessMessage('');
              setShowSuccessModal(true);
            }, 3000);

            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              companyName: '',
              contact: '',
              password: '',
              confirmPassword: ''
            });

            setTimeout(() => {
              router.push('/main');
              closeModal();
            }, 10000);

          } catch (firestoreError) {
            console.error('Firestore write error:', firestoreError.message);
            setErrorMessage(firestoreError.message || 'Failed to save user data.');
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Auth error:', error.message);
      setErrorMessage(error.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    if (closeModal) closeModal(); // Close the signup modal
    if (showLoginModal) showLoginModal(); // Open the login modal
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-transparent bg-opacity-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        {showSuccessModal ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50 mb-4"></div>
            <p className="text-blue-600 font-semibold text-center">Successfully Registered! Redirecting to Dashboard...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 flex flex-col sm:flex-row sm:space-x-4">
                <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
                  <label className="block text-gray-700 text-sm font-bold mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {successMessage && <p className="text-green-600 text-sm mt-2">{successMessage}</p>}
                {errorMessage && <p className="text-red-600 text-sm mt-2">{errorMessage}</p>}
              </div>

              <div className="flex flex-col sm:flex-row sm:space-x-4">
                <button
                  type="submit"
                  className="w-full sm:w-1/2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 mb-3 sm:mb-0"
                  disabled={loading}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  ) : (
                    'Sign up'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="text-blue-600 hover:underline font-bold focus:outline-none"
                >
                  Log in
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}