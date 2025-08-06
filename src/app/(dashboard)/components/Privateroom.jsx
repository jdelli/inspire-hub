"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Corrected import: Removed FiBuilding, added FaBuilding
import { FiCalendar, FiClock, FiPhone, FiArrowLeft, FiMapPin, FiSearch, FiUser, FiMail } from "react-icons/fi"; 
import { FaBuilding } from "react-icons/fa"; // Import FaBuilding from Font Awesome icons
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../script/firebaseConfig";
import { auth } from "../../../../script/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import emailjs from "@emailjs/browser"; 
import { sendPrivateOfficeBookingEmail } from "../../(admin)/utils/email";

const PRIVATE_OFFICES = [
  "Bicol", "Cebu", "Pampanga", "Nueva Ecija", "Panggasinan", "Laguna",
  "Rizal", "Bacolod", "Iloilo", "Batangas", "Mindoro", "Cagayan de Oro", "Quezon"
];

export default function BookingForm() {
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [reservedOffices, setReservedOffices] = useState([]);
  const [occupiedOffices, setOccupiedOffices] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState(""); // New state for name
  const [email, setEmail] = useState(""); // New state for email
  const [company, setCompany] = useState(""); // New state for company
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage submission status

  // Initialize EmailJS (important for client-side usage)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    } else {
      console.warn("EmailJS public key not set. Email sending may not work.");
    }
  }, []);

  // This useEffect will fetch offices that are 'occupied' (confirmed) from the 'privateOffice' collection.
  // These will be highlighted red.
  useEffect(() => {
    const fetchOccupiedOffices = async () => {
      try {
        const q = query(collection(db, "privateOffice"));
        const snapshot = await getDocs(q);
        const confirmedOffices = snapshot.docs.flatMap(doc => doc.data().selectedPO || []);
        setOccupiedOffices(confirmedOffices);
      } catch (error) {
        console.error("Error fetching occupied offices from privateOffice:", error);
      }
    };

    fetchOccupiedOffices();
  }, []);

  // This useEffect will fetch 'reserved' offices for the specific selected date and time
  // from the 'privateOfficeVisits' collection. These will be highlighted blue.
  useEffect(() => {
    const fetchReservedOfficesForDateTime = async () => {
      if (!selectedDate || !selectedTime) {
        setReservedOffices([]);
        return;
      }
      try {
        const q = query(
          collection(db, "privateOfficeVisits"),
          where("date", "==", selectedDate),
          where("time", "==", selectedTime)
        );
        const snapshot = await getDocs(q);
        const takenOffices = snapshot.docs.flatMap(doc => doc.data().office || []);
        setReservedOffices(takenOffices);
      } catch (error) {
        console.error("Error fetching reserved offices from privateOfficeVisits:", error);
      }
    };
    fetchReservedOfficesForDateTime();
  }, [selectedDate, selectedTime]);

  const handleOfficeClick = (office) => {
    if (occupiedOffices.includes(office)) {
      toast.error(`${office} is currently occupied.`);
      return;
    }
    if (reservedOffices.includes(office)) {
      toast.error(`${office} is reserved for the selected date and time.`);
      return;
    }
    setSelectedOffices((prev) =>
      prev.includes(office) ? prev.filter((o) => o !== office) : [...prev, office]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    if (!name || !email || !company || !selectedDate || !selectedTime || !phoneNumber || selectedOffices.length === 0) {
      toast.error("Please fill in all required fields and select at least one office.", { position: "top-center" });
      return;
    }

    setIsSubmitting(true); // Set submitting state to true

    const alreadyReservedNow = selectedOffices.some(office => reservedOffices.includes(office));
    const alreadyOccupied = selectedOffices.some(office => occupiedOffices.includes(office));

    if (alreadyReservedNow || alreadyOccupied) {
      toast.error("One or more of your selected offices became unavailable. Please re-select.", { position: "top-center" });
      setSelectedOffices([]);
      setIsSubmitting(false); // Reset submitting state
      return;
    }

    try {
      // The user object is typically for the logged-in user making the booking.
      // If you want the entered name/email/company to override, use those.
      // For this example, we'll prioritize the input fields.
      const user = auth.currentUser;
      const userName = name || (user ? (user.displayName || user.email) : "Anonymous");
      const userEmail = email || (user ? user.email : "No Email");

      // 1. Add reservation to Firestore
      await addDoc(collection(db, "privateOfficeVisits"), {
        name: userName,
        email: userEmail,
        company: company, // Added company
        phone: phoneNumber,
        date: selectedDate,
        time: selectedTime,
        office: selectedOffices,
        timestamp: new Date(),
        status: "pending",
        requestDate: serverTimestamp(),
      });

      // 2. Prepare booking details for the new email function
      const privateOfficeBookingDetails = {
        name: userName,
        email: userEmail,
        company: company, // Added company to email details
        phone: phoneNumber,
        date: selectedDate,
        time: selectedTime,
        selectedOffices: selectedOffices, // This maps to 'booked_offices' in the template
      };

      // 3. Send email to admin using the new dedicated function
      await sendPrivateOfficeBookingEmail(privateOfficeBookingDetails);
      toast.success("Reservation submitted and admin notified!");

      // Clear form and reset state
      setName(""); // Clear name
      setEmail(""); // Clear email
      setCompany(""); // Clear company
      setPhoneNumber("");
      setSelectedOffices([]);
      setSelectedDate("");
      setSelectedTime("");

    } catch (error) {
      console.error("Error submitting reservation or sending email:", error);
      toast.error("Failed to submit reservation or send email. Please try again.");
    } finally {
      setIsSubmitting(false); // Always reset submitting state
    }
  };

  const filteredPrivateOffices = PRIVATE_OFFICES.filter(office =>
    office.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 mt-20">
      <a
        href="/main"
        className="mb-4 flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back
      </a>
      <ToastContainer />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Booking Form */}
        <div className="md:w-1/2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <h1 className="text-2xl font-bold">Private Room Reservation Visit</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              <div className="flex items-center">
                <FiMapPin className="mr-1" />
                <span>{PRIVATE_OFFICES.length} Private Rooms</span>
              </div>
              <div className="flex items-center">
                <FiClock className="mr-1" />
                <span>Available: 7AM - 8PM (weekdays only)</span>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiUser className="mr-2" /> Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiMail className="mr-2" /> Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FaBuilding className="mr-2" /> Company * {/* Changed to FaBuilding */}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter your company name"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiCalendar className="mr-2" />Visit Date *
                </label>
                <div className="relative">
                 <DatePicker
                  selected={selectedDate ? new Date(selectedDate) : null}
                  onChange={(date) =>
                    setSelectedDate(date ? date.toLocaleDateString("en-CA") : "")
                  }
                  filterDate={(date) => {
                    const day = date.getDay();
                    if (day === 0 || day === 6) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    let weekdaysAdded = 0;
                    let checkDate = new Date(today);
                    while (weekdaysAdded < 2) {
                      checkDate.setDate(checkDate.getDate() + 1);
                      const checkDay = checkDate.getDay();
                      if (checkDay !== 0 && checkDay !== 6) weekdaysAdded++;
                    }
                    return date >= checkDate;
                  }}
                  minDate={new Date()}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholderText="Select a date"
                  dateFormat="MMMM d, yyyy"
                  required
                />

                  <FiCalendar className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* Time */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiClock className="mr-2" />Visit Time *
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Time</option>
                  {Array.from({ length: 13 }, (_, i) => {
                    const hour = i + 7;
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    return (
                      <option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                        {displayHour}:00 {ampm}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiPhone className="mr-2" /> Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Private Offices Selection */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FiMapPin className="mr-2" /> Select Private Office(s) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {PRIVATE_OFFICES.map((office) => {
                      const isReserved = reservedOffices.includes(office);
                      const isOccupied = occupiedOffices.includes(office);
                      const isSelected = selectedOffices.includes(office);

                      return (
                        <button
                          key={office}
                          type="button"
                          onClick={() => handleOfficeClick(office)}
                          disabled={isReserved || isOccupied || isSubmitting} // Disable if submitting
                          className={`
                            h-16 flex flex-col items-center justify-center rounded-md transition-colors text-center p-2
                            ${
                              isOccupied
                                ? "bg-red-100 text-red-800 border border-red-300 cursor-not-allowed"
                                : isReserved
                                ? "bg-blue-100 text-blue-800 border border-blue-300 cursor-not-allowed"
                                : isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 hover:border-blue-400"
                            }
                            ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                          `}
                        >
                          {office}
                          {isOccupied && <span className="block text-xs mt-1">(Occupied)</span>}
                          {isReserved && <span className="block text-xs mt-1">(Reserved)</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedOffices.length > 0
                      ? `Selected: ${selectedOffices.join(", ")}`
                      : "Click offices to select"}
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={selectedOffices.length === 0 || !selectedDate || !selectedTime || !phoneNumber || !name || !email || !company || isSubmitting}
                    className={`flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  >
                    {isSubmitting ? 'Processing...' : 'Reserve Office(s)'}
                  </button>
                  {selectedOffices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedOffices([])}
                      disabled={isSubmitting} // Disable if submitting
                      className={`py-3 px-4 border rounded-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Map/Search Section */}
        <div className="md:w-1/2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-light text-gray-800 mb-3">Private Room Reference</h2>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search offices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <FiSearch className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-10 top-3 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Responsive Lucidchart Container */}
            <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50 mb-4">
              <div className="relative" style={{ paddingBottom: '75%' }}>
                <iframe
                  allowFullScreen
                  frameBorder="0"
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://lucid.app/documents/embedded/968a8816-e828-463f-9154-8318a2612003"
                  id="ZSulLEtxiNwy"
                  title="Room Map Diagram"
                ></iframe>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">
                {searchTerm ? "Search Results" : "Office Legend"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredPrivateOffices.map(office => {
                  const isReserved = reservedOffices.includes(office);
                  const isOccupied = occupiedOffices.includes(office);

                  return (
                    <div
                      key={office}
                      className="flex items-center p-1 rounded hover:bg-blue-100 cursor-pointer"
                      onClick={() => {
                        handleOfficeClick(office);
                        setSearchTerm("");
                      }}
                    >
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          isOccupied ? "bg-red-500" : (isReserved ? "bg-blue-500" : "bg-gray-400")
                        }`}
                      ></div>
                      <span className={`text-sm ${
                        isOccupied ? "text-red-600 font-medium" : (isReserved ? "text-blue-600 font-medium" : "")
                      }`}>
                        {office}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-start gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span>Reserved (for selected date/time)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span>Occupied (generally unavailable)</span>
                </div>
              </div>
              {searchTerm && filteredPrivateOffices.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No offices found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}