"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi"; // Import the back arrow icon
import { db } from "../../../../script/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { sendVirtualOfficeInquiryEmail } from "../../(admin)/utils/email"; // Make sure this path is correct

const DETAILS = [
  {
    title: "Your Address",
    desc: "Your address becomes 6F Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila – to use on your website and business collateral. A great address should improve your SEO rankings.",
  },
  {
    title: "Local Phone Number",
    desc: "Local phone number with dedicated receptionists to answer your calls the way you would like and extend them to you wherever you are.",
  },
  {
    title: "On-Site Support",
    desc: "Secretaries and in-house IT support team available to assist your business on-site.",
  },
  {
    title: "Meeting Rooms",
    desc: "Fully equipped meeting rooms, video conferencing and boardrooms – your clients will be impressed.",
  },
  {
    title: "Mobile Business Phone",
    desc: "Take your business phone on your mobile anywhere outside your home location.",
  },
  {
    title: "Super Fast Wifi",
    desc: "Super fast, secure Wifi.",
  },
];

const TIME_OPTIONS = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const BookSeatsForm = () => {
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    phone: "",
    email: "",
    company: "",
    position: "",
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize EmailJS (important for client-side usage)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    } else {
      console.warn("EmailJS public key not set. Email sending may not work.");
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 1. Add form data to Firestore in 'virtualOfficeInquiry' collection
      await addDoc(collection(db, "virtualOfficeInquiry"), {
        ...form,
        timestamp: new Date(),
        status: "pending", // Ensure status is set upon initial submission
        requestDate: serverTimestamp(),
      });

      // 2. Send email to admin using the new dedicated function
      await sendVirtualOfficeInquiryEmail(form); // Pass the entire form object

      setSuccess(true);
      setForm({
        name: "",
        phone: "",
        email: "",
        company: "",
        position: "",
      });
      setTimeout(() => setSuccess(false), 3000); // Increased timeout for toast visibility
    } catch (error) {
      console.error("Error submitting booking or sending email:", error);
      alert("Error submitting inquiry or sending email. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen mt-5 bg-gradient-to-tr from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center py-16 mt-20">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-10 px-4 relative">
        {/* Back Button - Positioned at the top-left of the content area */}
        <Link
          href="/main"
          className="absolute -top-14 left-4 flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-gray-700 font-medium"
        >
          <FiArrowLeft className="mr-2" />
          Back
        </Link>

        {/* Left: Information Section */}
        <div className="flex-1 bg-orange-50 rounded-2xl border border-orange-100 p-10 flex flex-col justify-center h-fit my-0">
          <h2 className="text-2xl font-bold mb-4 text-orange-800">What You Get</h2>
          <ul className="space-y-5 pl-4 list-disc text-gray-900 text-base m-0">
            {DETAILS.map((item) => (
              <li key={item.title}>
                <span className="font-bold">{item.title}:</span>{" "}
                <span className="font-normal">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Form Section */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 bg-white rounded-2xl border border-gray-200 p-10 space-y-7"
        >
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">iHub Virtual Office</h1>
            <p className="text-orange-600 font-semibold text-base">Book to inquire</p>
          </header>

          {/* Form Fields */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              placeholder="Your full name"
            />
          </div>


          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-600">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="e.g. 0712 345 678"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              pattern="[0-9+\- ]{7,15}" // Basic pattern for phone numbers
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="e.g. your@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company" className="block text-sm font-medium text-gray-600">
              Company <span className="text-gray-400">(if applicable)</span>
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Enter your company (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="position" className="block text-sm font-medium text-gray-600">
              Position <span className="text-gray-400">(if applicable)</span>
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="Enter your position (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-orange-500 text-white rounded-lg font-semibold text-lg shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Booking..." : "Book Now"}
          </button>

          {/* Success Message */}
          {success && (
            <div className="mt-4 bg-orange-50 border border-orange-300 px-4 py-3 rounded-md flex items-center gap-2 text-orange-900 text-base shadow">
              <svg width="18" height="18" fill="none" className="text-orange-400">
                <circle cx="9" cy="9" r="9" fill="currentColor" />
                <path d="M5 9l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Inquiry submitted successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BookSeatsForm;