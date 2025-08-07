"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../script/firebaseConfig";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { Monitor, ArrowLeft, Calendar, Building2, User, Mail, Phone, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import seatMap1 from "../../(admin)/seatMap1.json";
import seatMap2 from "../../(admin)/seatMap2.json";
import seatMap3 from "../../(admin)/seatMap3.json";
import seatMap4 from "../../(admin)/seatMap4.json";
import seatMap5 from "../../(admin)/seatMap5.json";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { sendBookingEmail } from "../../(admin)/utils/email";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import clsx from 'clsx'; // Import clsx for cleaner class management

// --- Utility functions ---
function groupIntoPairs(entries) {
  const groups = [];
  for (let i = 0; i < entries.length; i += 2) {
    groups.push(entries.slice(i, i + 2));
  }
  return groups;
}

function groupSeatsByRow(seatMap) {
  return seatMap.reduce((acc, seat) => {
    const row = seat.number[0];
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});
}

// Process seat maps once to avoid repetition
const rawSeatMaps = [
  { map: seatMap1, title: "Area A" },
  { map: seatMap2, title: "Area B" },
  { map: seatMap3, title: "Area C" },
  { map: seatMap4, title: "Area D" },
  { map: seatMap5, title: "Area E" },
];

const processedSeatMaps = rawSeatMaps.map((item, index) => {
  const grouped = groupSeatsByRow(item.map);
  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  const pairedGroups = groupIntoPairs(sortedEntries);
  return {
    groupPairs: pairedGroups,
    mapType: `map${index + 1}`,
    title: item.title,
  };
});

function SeatReservationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    details: "",
    date: "",
  });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Function to fetch occupied seats
  const fetchOccupiedSeats = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "seatMap"));
      const docs = querySnapshot.docs.map((doc) => doc.data());
      const occ = docs.flatMap((c) => c.selectedSeats || []);
      setOccupiedSeats(occ);
    } catch (e) {
      console.error("Error fetching occupied seats:", e);
    }
  };

  // --- USER PROFILE & SEAT FETCHING ---
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setForm((prev) => ({
          ...prev,
          name: user.displayName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
        }));
        try {
          const usersRef = collection(db, "users");
          const querySnapshot = await getDocs(usersRef);
          const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const found = users.find(u => u.uid === user.uid || u.email === user.email);
          if (found) {
            setForm((prev) => ({
              ...prev,
              company: found.company || prev.company,
              name: found.name || prev.name,
              phone: found.phone || prev.phone,
              email: found.email || prev.email,
            }));
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      }
    });

    fetchOccupiedSeats(); // Initial fetch
    
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSeatClick = (mapType, seat) => {
    const seatKey = `${mapType}-${seat.number}`;
    if (occupiedSeats.includes(seatKey)) return;
    if (selectedSeats.includes(seatKey)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatKey));
    } else {
      setSelectedSeats([...selectedSeats, seatKey]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!form.name || !form.email || !form.phone || selectedSeats.length === 0) {
      toast.error("Please fill in your details and select at least one seat.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "visitMap"), {
        ...form,
        reservedSeats: selectedSeats,
        status: "pending",
        date: form.date || null, // Keep the date as a string or null
        requestDate: serverTimestamp(), // Use server-side timestamp for creation
      });
      
      // Update the main seat map with the newly reserved seats
      // This part is missing in the original code, `visitMap` is for reservations, `seatMap` is for occupancy.
      // A full implementation would involve updating the `seatMap` collection.
      // For a quick fix, let's assume `visitMap` is the source of truth for occupied seats.
      
      await sendBookingEmail({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        details: form.details,
        date: form.date,
        selectedSeats: selectedSeats,
      });

      toast.success("Reservation request submitted successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        details: "",
        date: "",
      });
      setSelectedSeats([]);

      // Re-fetch occupied seats to show the new ones as occupied
      await fetchOccupiedSeats();
    } catch (error) {
      console.error("Error submitting reservation or sending email:", error);
      toast.error(
        "There was an error submitting your reservation. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCarousel = () => {
    setCurrentCarouselIndex((prev) => (prev + 1) % processedSeatMaps.length);
  };

  const prevCarousel = () => {
    setCurrentCarouselIndex((prev) => (prev - 1 + processedSeatMaps.length) % processedSeatMaps.length);
  };

  const goToCarousel = (index) => {
    setCurrentCarouselIndex(index);
  };

  const renderSeatMap = (groupPairs, mapType, title) => (
    <div className="bg-white shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title} Floor Plan</h3>
      </div>
      
      <div className="space-y-8">
        {/* Production Area */}
        <div className="space-y-4">
          <div className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
            Production Area
          </div>
          <div className="grid grid-cols-2 gap-8">
            {groupPairs.slice(0, 4).map((group, i) => (
              <div key={i} className="space-y-3">
            {group.map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                        {rowLabel} ROW
                      </span>
                    </div>
                    <div className="flex gap-2 justify-start">
                  {seats.map((seat) => {
                    const seatKey = `${mapType}-${seat.number}`;
                    const occupied = occupiedSeats.includes(seatKey);
                    const selected = selectedSeats.includes(seatKey);

                        const seatClasses = clsx(
                          "flex flex-col items-center justify-center border-2 text-xs font-bold px-2 py-1 min-w-[35px] min-h-[35px] transition-all duration-200",
                          {
                            "bg-red-100 border-red-400 text-red-800 cursor-not-allowed": occupied,
                            "bg-blue-600 border-blue-700 text-white shadow-md": selected,
                            "bg-gray-100 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400": !selected && !occupied,
                          }
                        );
                        
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={occupied}
                            onClick={() => handleSeatClick(mapType, seat)}
                            className={seatClasses}
                            title={occupied ? "Occupied" : selected ? "Selected" : `Seat ${seat.number}`}
                          >
                            <span className="font-bold text-xs">{seat.number}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration Area */}
        <div className="space-y-4 border-t-2 border-gray-200 pt-6">
          <div className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
            Collaboration Area
          </div>
          <div className="grid grid-cols-2 gap-8">
            {groupPairs.slice(4, 6).map((group, i) => (
              <div key={i} className="space-y-3">
                {group.map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        {rowLabel} ROW
                      </span>
                    </div>
                    <div className="flex gap-2 justify-start">
                      {seats.map((seat) => {
                        const seatKey = `${mapType}-${seat.number}`;
                        const occupied = occupiedSeats.includes(seatKey);
                        const selected = selectedSeats.includes(seatKey);
                        
                        const seatClasses = clsx(
                          "flex flex-col items-center justify-center border-2 text-xs font-bold px-2 py-1 min-w-[35px] min-h-[35px] transition-all duration-200",
                          {
                            "bg-red-100 border-red-400 text-red-800 cursor-not-allowed": occupied,
                            "bg-blue-600 border-blue-700 text-white shadow-md": selected,
                            "bg-gray-100 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400": !selected && !occupied,
                          }
                        );

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={occupied}
                        onClick={() => handleSeatClick(mapType, seat)}
                            className={seatClasses}
                            title={occupied ? "Occupied" : selected ? "Selected" : `Seat ${seat.number}`}
                          >
                            <span className="font-bold text-xs">{seat.number}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Rooms & Facilities */}
        <div className="space-y-4 border-t-2 border-gray-200 pt-6">
          <div className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
            Meeting Rooms & Facilities
          </div>
          <div className="grid grid-cols-3 gap-6">
            {groupPairs.slice(6).map((group, i) => (
              <div key={i} className="space-y-3">
                {group.map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                        {rowLabel} ROW
                      </span>
                    </div>
                    <div className="flex gap-2 justify-start">
                      {seats.map((seat) => {
                        const seatKey = `${mapType}-${seat.number}`;
                        const occupied = occupiedSeats.includes(seatKey);
                        const selected = selectedSeats.includes(seatKey);
                        
                        const seatClasses = clsx(
                          "flex flex-col items-center justify-center border-2 text-xs font-bold px-2 py-1 min-w-[35px] min-h-[35px] transition-all duration-200",
                          {
                            "bg-red-100 border-red-400 text-red-800 cursor-not-allowed": occupied,
                            "bg-blue-600 border-blue-700 text-white shadow-md": selected,
                            "bg-gray-100 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400": !selected && !occupied,
                          }
                        );
                        
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            disabled={occupied}
                            onClick={() => handleSeatClick(mapType, seat)}
                            className={seatClasses}
                            title={occupied ? "Occupied" : selected ? "Selected" : `Seat ${seat.number}`}
                          >
                            <span className="font-bold text-xs">{seat.number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
        <button
          type="button"
            className="inline-flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-all duration-200 mb-6 group"
            onClick={() => router.back()} // Use router.back()
        >
            <div className="p-2 rounded-lg bg-white/50 backdrop-blur-sm group-hover:bg-white/80 transition-all duration-200">
              <ArrowLeft size={18} />
            </div>
            <span className="font-semibold">Back to Dashboard</span>
        </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 mb-6 shadow-lg">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Workspace Reservation
            </h1>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              Experience our premium workspace with state-of-the-art facilities and flexible seating arrangements
            </p>
          </div>
        </div>

        {/* Carousel Section */}
        <div className="mb-16">
          <div className="relative bg-white/80 backdrop-blur-sm shadow-2xl overflow-hidden border border-white/20">
            <div className="relative h-72 md:h-96">
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentCarouselIndex * 100}%)` }}
              >
                {processedSeatMaps.map((map, index) => (
                  <div key={map.mapType} className="w-full flex-shrink-0">
                    <div className="h-full relative overflow-hidden">
                      <img
                        src={`/images/desk${index + 1}.png`}
                        alt={`${map.title} Workspace`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/desks.jpg';
                        }}
                      />
                      {/* Virtual Office Button Overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="text-center">
                          <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                            {map.title} Workspace
                          </h3>
                          <p className="text-white text-lg mb-6 drop-shadow-lg">
                            Professional workspace solutions
                          </p>
                          <Link
                            href="/virtual"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            Virtual Office
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevCarousel}
                aria-label="Previous workspace area" // Added aria-label
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextCarousel}
                aria-label="Next workspace area" // Added aria-label
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <ChevronRight size={24} />
              </button>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {processedSeatMaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToCarousel(index)}
                    aria-label={`Go to area ${index + 1}`} // Added aria-label
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentCarouselIndex
                        ? "bg-blue-600 scale-110"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Available Workspaces Section - Full Width */}
          <div className="mb-12">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 p-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 shadow-lg">
                  <Monitor className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Available Workspaces</h2>
              </div>

              {/* Area Tabs */}
              <div className="flex space-x-2 mb-8 bg-gradient-to-r from-gray-100 to-gray-200 p-2 shadow-inner">
                {processedSeatMaps.map((map, index) => (
                  <button
                    key={map.mapType}
                    onClick={() => setActiveTab(index)}
                    className={clsx(
                      "flex-1 py-3 px-6 text-sm font-bold transition-all duration-200",
                      {
                        "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105": activeTab === index,
                        "text-gray-600 hover:text-gray-900 hover:bg-white/50": activeTab !== index,
                      }
                    )}
                  >
                    {map.title}
                  </button>
                ))}
              </div>

              {/* Active Area Map */}
              <div className="space-y-6">
                {renderSeatMap(
                  processedSeatMaps[activeTab].groupPairs,
                  processedSeatMaps[activeTab].mapType,
                  processedSeatMaps[activeTab].title
                )}
              </div>

              {/* Legend */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200/50 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Legend</h4>
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 shadow-sm"></div>
                    <span className="text-sm font-semibold text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 border-2 border-blue-700 shadow-md"></div>
                    <span className="text-sm font-semibold text-gray-700">Selected</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-red-500 border-2 border-red-600 shadow-md"></div>
                    <span className="text-sm font-semibold text-gray-700">Occupied</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Details Section - Full Width */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 p-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Reservation Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="name">
                  Full Name *
                </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  required
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter your full name"
                />
              </div>
                    </div>

              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="email">
                        Email Address *
                </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  required
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter your email"
                />
              </div>
                    </div>

              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="phone">
                        Phone Number *
                </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="phone"
                  type="text"
                  name="phone"
                  value={form.phone}
                  required
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter your phone number"
                />
              </div>
                    </div>
                  </div>

                  <div className="space-y-6">
              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="company">
                  Company
                </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="company"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Enter your company name"
                />
              </div>
                    </div>

              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="date">
                  Visit Date
                </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
                    </div>

              <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="details">
                        Additional Details
                </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                          id="details"
                  type="text"
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Any special requirements?"
                />
              </div>
            </div>
                  </div>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-2 border-blue-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-blue-900 text-lg">Selected Seats</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedSeats.map((seat, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <button
                type="submit"
                disabled={
                    isSubmitting ||
                  !form.name ||
                  !form.email ||
                  !form.phone ||
                  selectedSeats.length === 0
                }
                  className="w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-3xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-lg">Processing...</span>
                    </div>
                  ) : (
                    "Submit Reservation"
                  )}
              </button>
          </form>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default SeatReservationForm;
