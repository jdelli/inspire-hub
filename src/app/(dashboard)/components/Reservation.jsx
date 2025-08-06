import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../../../../script/firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { FiPlus, FiTrash2, FiClock, FiUser, FiMail, FiPhone, FiCalendar, FiInfo, FiArrowLeft } from "react-icons/fi";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSearchParams } from "next/navigation";
import { sendReservationEmail } from "../../(admin)/utils/email";

// Meeting room info (for dynamic display/rates)
const MEETING_ROOMS = {
  boracay: { name: 'Boracay', price: 2800, capacity: "9 - 12" },
  coron: { name: 'Coron', price: 1450, capacity: 5 },
  elnido: { name: 'El Nido', price: 4300, capacity: "12 - 16" },
  siargao: { name: 'Siargao', price: 11000, capacity: 50 },
};

const initialTimeSlots = [
  { time: "07", status: "available" },
  { time: "08", status: "available" },
  { time: "09", status: "available" },
  { time: "10", status: "available" },
  { time: "11", status: "available" },
  { time: "12", status: "available" },
  { time: "13", status: "available" },
  { time: "14", status: "available" },
  { time: "15", status: "available" },
  { time: "16", status: "available" },
  { time: "17", status: "after-hours" },
  { time: "18", status: "after-hours" },
  { time: "19", status: "after-hours" },
];

const statusStyles = {
  available: "bg-white border border-gray-300",
  selected: "bg-blue-500 text-white border border-blue-600",
  busy: "bg-gray-200 border border-gray-300 cursor-not-allowed", // Changed to busy for general unavailability
  reserved: "bg-red-500 text-white border border-red-600 cursor-not-allowed", // Added for explicitly reserved (accepted)
  tentative: "bg-orange-300 border border-orange-400 cursor-not-allowed", // Orange for tentative
  "after-hours": "bg-gray-100 border border-gray-300 bg-[repeating-linear-gradient(45deg,_#f0f0f0_0,_#f0f0f0_5px,_#fff_5px,_#fff_10px)]",
};

const statusLabels = {
  available: "Available",
  selected: "Selected",
  busy: "Unavailable", // General unavailable label
  reserved: "Reserved", // Specific for accepted bookings
  tentative: "Tentative Booking", // Label for tentative
  "after-hours": "After Hours (+20%)"
};

const toMilitaryTime = (timeStr) => {
  if (!timeStr) return "";
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);
  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

export default function TimeSlotSchedule() {
  const searchParams = useSearchParams();
  const roomKey = (searchParams.get("room") || "boracay").toLowerCase();
  const room = MEETING_ROOMS[roomKey] || MEETING_ROOMS.boracay;

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayFormatted = () => {
    const today = new Date();
    // Ensure the date is treated as local for consistency
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    // FIX: Initialize date with today's date
    date: getTodayFormatted(),
    time: "",
    duration: "",
    guests: [],
    specialRequests: "",
  });

  const [slots, setSlots] = useState(initialTimeSlots);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to fetch and update reserved and tentative slots
  const fetchBookedSlots = async (selectedDate) => {
    if (!selectedDate || !room.name) {
      setSlots(initialTimeSlots); // Reset to initial if no date or room
      return;
    }

    try {
      const q = query(
        collection(db, "meeting room"),
        where("date", "==", selectedDate),
        where("room", "==", room.name)
      );
      const querySnapshot = await getDocs(q);

      const reservedSlots = [];
      const tentativeSlots = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fromTime = parseInt(data.from_time.split(":")[0]);
        const duration = parseInt(data.duration);
        const toTime = fromTime + duration;

        for (let i = fromTime; i < toTime; i++) {
          if (i >= 7 && i <= 19) { // Only consider hours within the operational range
            if (data.status === "accepted") {
              reservedSlots.push(i.toString().padStart(2, "0"));
            } else if (data.status === "pending") {
              tentativeSlots.push(i.toString().padStart(2, "0"));
            }
          }
        }
      });

      const updatedSlots = initialTimeSlots.map((slot) => {
        if (reservedSlots.includes(slot.time)) {
          return { ...slot, status: "reserved" };
        } else if (tentativeSlots.includes(slot.time)) {
          return { ...slot, status: "tentative" };
        } else if (parseInt(slot.time) >= 17) {
          return { ...slot, status: "after-hours" };
        }
        return { ...slot, status: "available" };
      });
      setSlots(updatedSlots);
    } catch (error) {
      console.error("Error fetching booked slots: ", error);
      toast.error("Failed to load availability. Please try again.", { position: "top-center" });
    }
  };

  // useEffect to fetch booked slots when date or room changes
  useEffect(() => {
    // FIX: This useEffect will now trigger on initial render because formData.date is initialized
    if (formData.date && room.name) {
      fetchBookedSlots(formData.date);
    } else {
      setSlots(initialTimeSlots); // Reset slots if no date or room is selected
    }
  }, [formData.date, room.name]);

  const updateSelectedSlots = (startTime, duration) => {
    // If startTime or duration are empty, revert slots to their fetched (booked) state
    if (!startTime || !duration) {
      // FIX: Ensure fetchBookedSlots is called with the current date to reflect actual bookings
      fetchBookedSlots(formData.date);
      return;
    }

    const startHour = parseInt(toMilitaryTime(startTime).split(":")[0]);
    const durationHours = parseInt(duration);
    const endHour = startHour + durationHours;

    if (endHour > 20) {
      toast.error("Booking cannot extend beyond 8:00 PM (20:00)", {
        position: "top-center",
        autoClose: 3000,
      });
      fetchBookedSlots(formData.date); // Revert on invalid duration
      return;
    }

    let hasConflict = false;
    // Create a copy of the current slots to base updates on
    const currentSlotsCopy = [...slots];

    const newSlots = currentSlotsCopy.map((slot) => {
      const slotHour = parseInt(slot.time);
      if (slotHour >= startHour && slotHour < endHour) {
        // If the slot is reserved or tentative, it's a conflict
        if (slot.status === "reserved" || slot.status === "tentative") {
          hasConflict = true;
          return slot; // Keep its reserved/tentative status
        } else {
          return { ...slot, status: "selected" };
        }
      }
      // If a slot was previously selected but is now outside the new selection, revert it
      // This part needs to be careful not to override existing reserved/tentative statuses.
      if (slot.status === "selected") {
          // Re-evaluate its original status based on current reserved/tentative data
          const isReserved = currentSlotsCopy.some(s => s.time === slot.time && s.status === "reserved");
          const isTentative = currentSlotsCopy.some(s => s.time === slot.time && s.status === "tentative");

          if (isReserved) return { ...slot, status: "reserved" };
          if (isTentative) return { ...slot, status: "tentative" };
          if (parseInt(slot.time) >= 17) return { ...slot, status: "after-hours" };
          return { ...slot, status: "available" };
      }
      return slot;
    });

    if (hasConflict) {
      toast.error("Selected time overlaps with unavailable or tentative slots. Please review and re-select.", {
        position: "top-center",
        autoClose: 3000,
      });
      fetchBookedSlots(formData.date); // Re-fetch to display actual booked slots after conflict
      return;
    }

    const includesAfterHours = newSlots.some((slot) => {
      const slotHour = parseInt(slot.time);
      return slotHour >= startHour && slotHour < endHour && slotHour >= 17;
    });

    if (includesAfterHours) {
      toast.warning("After-hours booking (additional charges apply)", {
        position: "top-center",
        autoClose: 4000,
      });
    }
    setSlots(newSlots);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      const selectedDate = new Date(value);
      const day = selectedDate.getDay();
      // Check for weekends (0 for Sunday, 6 for Saturday)
      if (day === 0 || day === 6) {
        toast.error("Weekend bookings are not available", {
          position: "top-center",
          autoClose: 3000,
        });
        // Do not update formData.date if it's a weekend
        return;
      }
    }

    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    if (name === "date") {
      // When date changes, immediately fetch new booked slots and then update selected slots if time/duration are already set
      fetchBookedSlots(updatedFormData.date).then(() => {
        if (updatedFormData.time && updatedFormData.duration) {
          updateSelectedSlots(
            updatedFormData.time,
            updatedFormData.duration
          );
        }
        // If time/duration are not set, fetchBookedSlots already handled setting the slots
      });
    } else if ((name === "time" && updatedFormData.duration) || (name === "duration" && updatedFormData.time)) {
      // If both time and duration are set, update selected slots
      // Using a setTimeout of 0 to allow state update to batch or for the next render cycle to pick up latest slots
      setTimeout(() => {
        updateSelectedSlots(
          updatedFormData.time,
          updatedFormData.duration
        );
      }, 0);
    } else if (name === "time" || name === "duration") {
      // If only one of time/duration changed, and the other is not set, revert to fetched slots
      // Ensure we re-fetch to clear any previous "selected" states if time/duration combination is no longer valid
      fetchBookedSlots(updatedFormData.date);
    }
  };

  const addGuest = () => {
    if (formData.guests.length >= 8) {
      toast.warning("Maximum 8 guests allowed", { position: "top-center" });
      return;
    }
    setFormData(prev => ({ ...prev, guests: [...prev.guests, ""] }));
  };

  const removeGuest = (index) => {
    setFormData(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index)
    }));
  };

  const handleGuestNameChange = (index, value) => {
    setFormData(prev => {
      const updatedGuests = [...prev.guests];
      updatedGuests[index] = value;
      return { ...prev, guests: updatedGuests };
    });
  };

  const calculateTotalCost = () => {
    if (!formData.duration) return 0;
    const duration = parseInt(formData.duration);
    const baseRate = room.price;
    let total = baseRate * duration;
    if (formData.time) {
      const startHour = parseInt(toMilitaryTime(formData.time).split(":")[0]);
      const selectedEndHour = startHour + duration;
      // Calculate after-hours overlap for pricing
      const afterHoursOverlap = Math.max(0, Math.min(selectedEndHour, 20) - Math.max(startHour, 17));

      if (afterHoursOverlap > 0) {
        const regularHoursDuration = duration - afterHoursOverlap;
        total = (baseRate * regularHoursDuration) + (baseRate * afterHoursOverlap * 1.2);
      }
    }
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.date || !formData.time || !formData.duration) {
      toast.error("Please fill in all required fields", { position: "top-center" });
      setIsSubmitting(false);
      return;
    }

    const startHour = parseInt(toMilitaryTime(formData.time).split(":")[0]);
    const durationHours = parseInt(formData.duration);
    const endHour = startHour + durationHours;

    const hasConflict = slots.some((slot) => {
      const slotHour = parseInt(slot.time);
      return (
        slotHour >= startHour &&
        slotHour < endHour &&
        (slot.status === "reserved" || slot.status === "tentative") // Check for both reserved and tentative
      );
    });

    if (hasConflict) {
      toast.error("Your selected time now overlaps with unavailable or tentative slots. Please review and re-select.", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    const selectedSlotsDisplay = slots
      .filter((slot) => slot.status === "selected")
      .map((s) => s.time)
      .join(", ");

    const militaryTime = toMilitaryTime(formData.time);
    const [fromHour, fromMin] = militaryTime.split(":").map(Number);
    const durationHoursFinal = parseInt(formData.duration);
    const toHour = fromHour + durationHoursFinal;
    const toTime = `${toHour.toString().padStart(2, "0")}:${fromMin.toString().padStart(2, "0")}`;

    const reservationData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formData.date,
      time: militaryTime,
      duration: formData.duration,
      guests: formData.guests.filter(guest => guest.trim() !== ''),
      specialRequests: formData.specialRequests,
      room: room.name,
      selectedSlots: selectedSlotsDisplay,
      from_time: militaryTime,
      to_time: toTime,
      timestamp: new Date(),
      status: "pending", // Initially set as pending
      totalCost: calculateTotalCost(),
      requestDate: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "meeting room"), reservationData);
      toast.success("Reservation submitted successfully! Awaiting confirmation.", { position: "top-center" });

      // Send email after successful Firebase submission
      const emailSent = await sendReservationEmail(reservationData);
      if (emailSent) {
        toast.info("Confirmation email sent!", { position: "top-center" });
      } else {
        toast.error("Failed to send confirmation email.", { position: "top-center" });
      }

      // Clear form data and re-fetch booked slots to update the UI
      setFormData({
        name: "",
        email: "",
        phone: "",
        // After submission, keep the date selected or reset to today's date
        date: formData.date, // Keep the current date to show updated availability for it
        time: "",
        duration: "",
        guests: [],
        specialRequests: "",
      });
      // After successful submission, re-fetch booked and tentative slots for the selected date
      fetchBookedSlots(formData.date);
    } catch (error) {
      console.error("Error adding reservation or sending email: ", error);
      toast.error("Failed to submit reservation. Please try again.", { position: "top-center" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-20">
      <a
        href="/meetingroomlp"
        className="mb-4 flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back
      </a>
      <ToastContainer />
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <h1 className="text-2xl font-bold">{room.name} Meeting Room</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
            <div className="flex items-center">
              <FiUser className="mr-1" />
              <span>Capacity: {room.capacity}</span>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1" />
              <span>Rate: ₱{room.price.toLocaleString()}/hour</span>
            </div>
            <div className="flex items-center">
              <FiInfo className="mr-1" />
              <span>After-hours (5PM-8PM): +20%</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiUser className="mr-2" /> Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiMail className="mr-2" /> Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiPhone className="mr-2" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="09123456789"
                />
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiCalendar className="mr-2" /> Date *
                </label>
                <DatePicker
                  selected={formData.date ? new Date(formData.date) : null}
                  onChange={(date) => {
                    let formattedDate = "";
                    if (date) {
                      // Ensure date is treated as local date for consistency
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const year = localDate.getFullYear();
                      const month = String(localDate.getMonth() + 1).padStart(2, '0');
                      const day = String(localDate.getDate()).padStart(2, '0');
                      formattedDate = `${year}-${month}-${day}`;
                    }

                    handleChange({
                      target: { name: "date", value: formattedDate },
                    });
                  }}
                  filterDate={(date) => {
                    const day = date.getDay();
                    if (day === 0 || day === 6) return false; // Disable weekends

                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset time to compare dates only

                    // Allow selection starting 2 weekdays from today
                    let weekdaysAdded = 0;
                    let checkDate = new Date(today);
                    while (weekdaysAdded < 2) {
                      checkDate.setDate(checkDate.getDate() + 1);
                      const checkDay = checkDate.getDay();
                      if (checkDay !== 0 && checkDay !== 6) weekdaysAdded++;
                    }

                    return date >= checkDate;
                  }}
                  minDate={new Date()} // Disallow past dates
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholderText="Select a date"
                  dateFormat="MMMM d, yyyy"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Start Time *</label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Time</option>
                  {Array.from({ length: 13 }, (_, i) => { // 7 AM to 7 PM (07-19 military time)
                    const hour = i + 7;
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const displayHour = hour > 12 ? hour - 12 : hour;
                    const timeValue = `${displayHour}:00 ${ampm}`;
                    const militaryHour = hour.toString().padStart(2, '0');

                    // Disable option if the slot for this hour is reserved or tentative
                    const isBooked = slots.some(
                      (slot) => slot.time === militaryHour && (slot.status === "reserved" || slot.status === "tentative")
                    );

                    return (
                      <option key={hour} value={timeValue} disabled={isBooked}>
                        {displayHour}:00 {ampm} {isBooked ? "(Unavailable)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Duration *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Duration</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const durationHours = i + 1;
                    const startHour = formData.time ? parseInt(toMilitaryTime(formData.time).split(":")[0]) : null;
                    const endHour = startHour !== null ? startHour + durationHours : null;

                    // Disable duration if it causes an overlap with reserved/tentative slots
                    let isDisabled = false;
                    if (startHour !== null) {
                      for (let h = startHour; h < endHour; h++) {
                        const militaryHour = h.toString().padStart(2, '0');
                        const conflict = slots.find(
                          (slot) => slot.time === militaryHour && (slot.status === "reserved" || slot.status === "tentative")
                        );
                        if (conflict) {
                          isDisabled = true;
                          break;
                        }
                        // Also check if duration extends beyond 8 PM
                        if (h >= 20) { // 20:00 is 8 PM. If any part of the booking is at or after 8 PM, it's invalid.
                          isDisabled = true;
                          break;
                        }
                      }
                    } else if (formData.time) { // If time is selected but startHour couldn't be parsed
                        isDisabled = true;
                    }


                    return (
                      <option key={i} value={`${durationHours}`} disabled={isDisabled}>
                        {durationHours} hour{durationHours !== 1 ? "s" : ""} {isDisabled ? "(Conflict)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Time Slot Visualization */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-500">7:00 AM</span>
                <div className="flex-1 flex border border-gray-200 rounded-md overflow-hidden">
                  {slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-12 flex items-center justify-center transition-colors ${statusStyles[slot.status]}`}
                      title={statusLabels[slot.status]}
                    >
                      <span className={`text-xs font-medium ${slot.status === "selected" || slot.status === "reserved" ? "text-white" : "text-gray-700"}`}>
                        {slot.time}:00
                      </span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-500">8:00 PM</span>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                {Object.entries(statusStyles).map(([status, style]) => (
                  <div key={status} className="flex items-center">
                    <div className={`w-4 h-4 mr-2 ${style} rounded-sm`}></div>
                    <span className="text-gray-700">{statusLabels[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Management */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Guest Names</label>
              {formData.guests.length > 0 && (
                <div className={`space-y-3 ${formData.guests.length >= 3 ? 'max-h-[180px] overflow-y-auto pr-2' : ''}`}>
                  {formData.guests.map((guest, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={guest}
                        onChange={(e) => handleGuestNameChange(index, e.target.value)}
                        placeholder={`Guest ${index + 1} name`}
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeGuest(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove guest"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addGuest}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <FiPlus className="mr-1" /> Add Guest
              </button>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requests</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="e.g. AV equipment, catering requirements, etc."
                className="mt-1 block w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Summary and Submit */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Total</h3>
                  <p className="text-sm text-gray-500">Includes all applicable charges</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {calculateTotalCost().toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
              </button>

              <p className="mt-3 text-xs text-gray-500 text-center">
                By confirming, you agree to our cancellation policy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}