"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../script/firebaseConfig";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { Monitor } from "lucide-react";
import seatMap1 from "../../(admin)/seatMap1.json";
import seatMap2 from "../../(admin)/seatMap2.json";
import seatMap3 from "../../(admin)/seatMap3.json";
import seatMap4 from "../../(admin)/seatMap4.json";
import seatMap5 from "../../(admin)/seatMap5.json";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { sendBookingEmail } from "../../(admin)/utils/email";

// Import ToastContainer and toast
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Don't forget to import the CSS!



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
const groupedSeats1 = groupSeatsByRow(seatMap1);
const groupedSeats2 = groupSeatsByRow(seatMap2);
const groupedSeats3 = groupSeatsByRow(seatMap3);
const groupedSeats4 = groupSeatsByRow(seatMap4);
const groupedSeats5 = groupSeatsByRow(seatMap5);

const rowEntries1 = Object.entries(groupedSeats1).sort(([a], [b]) =>
  a.localeCompare(b)
);
const rowEntries2 = Object.entries(groupedSeats2).sort(([a], [b]) =>
  a.localeCompare(b)
);
const rowEntries3 = Object.entries(groupedSeats3).sort(([a], [b]) =>
  a.localeCompare(b)
);
const rowEntries4 = Object.entries(groupedSeats4).sort(([a], [b]) =>
  a.localeCompare(b)
);
const rowEntries5 = Object.entries(groupedSeats5).sort(([a], [b]) =>
  a.localeCompare(b)
);

const groupPairs1 = groupIntoPairs(rowEntries1);
const groupPairs2 = groupIntoPairs(rowEntries2);
const groupPairs3 = groupIntoPairs(rowEntries3);
const groupPairs4 = groupIntoPairs(rowEntries4);
const groupPairs5 = groupIntoPairs(rowEntries5);

const seatMaps = [
  { groupPairs: groupPairs1, mapType: "map1", title: "Seat Map 1" },
  { groupPairs: groupPairs2, mapType: "map2", title: "Seat Map 2" },
  { groupPairs: groupPairs3, mapType: "map3", title: "Seat Map 3" },
  { groupPairs: groupPairs4, mapType: "map4", title: "Seat Map 4" },
  { groupPairs: groupPairs5, mapType: "map5", title: "Seat Map 5" },
];



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
  // --- NEW STATE: isSubmitting ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- USER PROFILE STATE ---
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
          const userProfileSnap = await getDocs(collection(db, "users"));
          const userProfileArr = userProfileSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const found = userProfileArr.find(
            (u) =>
              (u.uid && u.uid === user.uid) || (u.email && u.email === user.email)
          );
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
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchOccupiedSeats() {
      const querySnapshot = await getDocs(collection(db, "seatMap"));
      const docs = querySnapshot.docs.map((doc) => doc.data());
      const occ = docs.flatMap((c) => c.selectedSeats || []);
      setOccupiedSeats(occ);
    }
    fetchOccupiedSeats();
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

    // Prevent submission if already submitting
    if (isSubmitting) {
      return;
    }

    if (!form.name || !form.email || !form.phone || selectedSeats.length === 0) {
      toast.error("Please fill in your details and select at least one seat.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    // --- Set isSubmitting to true at the start of submission ---
    setIsSubmitting(true);

    try {
      // 1. Add reservation to Firestore
      await addDoc(collection(db, "visitMap"), {
        ...form,
        reservedSeats: selectedSeats,
        status: "pending",
        date: form.date ? new Date(form.date) : null,
        createdAt: new Date(),
        requestDate: serverTimestamp(),
      });

      // 2. Send email to admin using the utility function
      await sendBookingEmail({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        details: form.details,
        date: form.date,
        selectedSeats: selectedSeats,
      });

      toast.success("Reservation request submitted and email sent to admin!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Clear form and selected seats only on success
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        details: "",
        date: "",
      });
      setSelectedSeats([]);

    } catch (error) {
      console.error("Error submitting reservation or sending email:", error);
      toast.error(
        "There was an error submitting your reservation or sending the email. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
    } finally {
      // --- Always reset isSubmitting to false after try/catch ---
      setIsSubmitting(false);
    }
  };

  const renderSeatMap = (groupPairs, mapType, title) => (
    <div className="flex flex-col bg-white shadow rounded-lg p-2 w-full max-w-xs mx-auto my-2">
      <div className="text-sm font-semibold text-center mb-2">{title}</div>
      <div className="flex flex-col gap-2">
        {groupPairs.map((group, i) => (
          <div key={i} className="w-full">
            {group.map(([rowLabel, seats]) => (
              <div key={rowLabel} className="mb-2">
                <div className="text-xs font-medium mb-1">{rowLabel} Row</div>
                <div className="flex gap-1 justify-center">
                  {seats.map((seat) => {
                    const seatKey = `${mapType}-${seat.number}`;
                    const occupied = occupiedSeats.includes(seatKey);
                    const selected = selectedSeats.includes(seatKey);

                    let seatColor = occupied
                      ? "bg-red-400 text-white border-red-600"
                      : selected
                      ? "bg-blue-600 text-white border-blue-700"
                      : seat.type === "window"
                      ? "bg-gray-100 border-gray-300 text-gray-700"
                      : "bg-gray-50 border-gray-200 text-gray-700";

                    let hoverTitle = occupied
                      ? "This seat is occupied"
                      : selected
                      ? "Selected"
                      : seat.type === "window"
                      ? "Window seat (vacant)"
                      : "Vacant seat";

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        title={hoverTitle}
                        disabled={occupied}
                        onClick={() => handleSeatClick(mapType, seat)}
                        className={`flex flex-col items-center justify-center rounded border text-xs font-semibold px-2 py-1 min-w-[32px] min-h-[30px] transition
                          ${seatColor}
                          ${
                            occupied
                              ? "cursor-not-allowed opacity-70"
                              : "hover:bg-blue-500 hover:text-white"
                          }
                        `}
                      >
                        <Monitor size={12} className="mb-0.5" />
                        {seat.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {i < groupPairs.length - 1 && (
              <div className="border-t border-gray-200 my-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 py-10 px-2">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
        <button
          type="button"
          className="mb-4 mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition text-gray-700 text-sm"
          onClick={() => router.push("/main")}
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-center mb-4">Reserve a Seat Visit</h1>

        {/* Form Section */}
        <div className="w-full mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  required
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  required
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  required
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Visit Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Details
                </label>
                <input
                  type="text"
                  name="details"
                  value={form.details}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                // --- Updated disabled prop ---
                disabled={
                  isSubmitting || // Disable if submission is in progress
                  !form.name ||
                  !form.email ||
                  !form.phone ||
                  selectedSeats.length === 0
                }
                className="w-48 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {/* --- Change button text while submitting --- */}
                {isSubmitting ? "Submitting..." : "Submit Reservation"}
              </button>
            </div>
          </form>
        </div>

        {/* Seatmap Section */}
        <div className="w-full">
          <div className="mb-2 text-center">
            <div className="font-medium mb-2">Select your seats</div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-400 text-white border border-red-500">
                Occupied
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-blue-600 text-white border border-blue-700">
                Selected
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 border border-gray-300 text-gray-700">
                Vacant
              </span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
              {seatMaps.map((map) => (
                <div key={map.mapType} className="flex-1 min-w-[220px] max-w-xs">
                  {renderSeatMap(map.groupPairs, map.mapType, map.title)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer /> {/* Add this component at the root of your return */}
    </div>
  );
}

export default SeatReservationForm;