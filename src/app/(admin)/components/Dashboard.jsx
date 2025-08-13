"use client";
import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../../../script/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import seatMap1 from "../../(admin)/seatMap1.json";
import seatMap2 from "../../(admin)/seatMap2.json";
import seatMap3 from "../../(admin)/seatMap3.json";
import seatMap4 from "../../(admin)/seatMap4.json";
import seatMap5 from "../../(admin)/seatMap5.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  HiOutlineUserGroup,
  HiOutlineUserAdd,
  HiOutlineUserRemove,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
} from "react-icons/hi";
import { FaChair, FaRegCalendarAlt } from "react-icons/fa";
import { MdOutlineEventNote, MdMeetingRoom } from "react-icons/md";
import { BsGraphUp } from "react-icons/bs";

const COLORS = ["#10b981", "#ef4444", "#6366f1"];

const totalSeats = seatMap1.length + seatMap2.length + seatMap3.length + seatMap4.length + seatMap5.length;

const Dashboard = () => {
  const [seatData, setSeatData] = useState([]);
  const [visitData, setVisitData] = useState([]); // Kept for existing chart usage, but `allPendingVisits` is primary for the list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState(totalSeats);
  const [privateOfficeList, setPrivateOfficeList] = useState([]);
  const [occupiedPrivateOffices, setOccupiedPrivateOffices] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expiringTenants, setExpiringTenants] = useState([]);
  const [allPendingVisits, setAllPendingVisits] = useState([]); // New state for all pending visits
  const [meetingRoomBookings, setMeetingRoomBookings] = useState({
    pending: [],
    accepted: [],
    ongoing: [],
  }); // New state for meeting room bookings
  const [activeMeetingRoomTab, setActiveMeetingRoomTab] = useState('pending'); // New state for active tab

  // Format time helper
  const formatTime = useCallback((timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  }, []);

  // Helper to calculate days remaining
  const calculateDaysRemaining = useCallback((endDate) => {
    if (!endDate) return null;
    let dateObj;
    if (endDate.toDate && typeof endDate.toDate === 'function') {
      dateObj = endDate.toDate();
    } else if (typeof endDate === 'string') {
      dateObj = new Date(endDate);
    } else if (endDate instanceof Date) {
      dateObj = endDate;
    } else {
      return null; // Invalid date format
    }

    const now = new Date();
    // Set time to 00:00:00 for accurate day comparison
    now.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);

    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const collectionsToFetch = [
          { name: "seatMap", setState: setSeatData, isTenant: true, type: "Dedicated Desk" },
          { name: "privateOffice", setState: setPrivateOfficeList, isTenant: true, type: "Private Office" },
          { name: "virtualOffice", isTenant: true, type: "Virtual Office" },
          { name: "visitMap", isTenant: false, visitType: "Dedicated Desk Visit" },
          { name: "privateOfficeVisits", isTenant: false, visitType: "Private Office Visit" },
          { name: "virtualOfficeInquiry", isTenant: false, visitType: "Virtual Office Inquiry" },
          { name: "meeting room", isMeetingRoom: true } // Added for meeting room bookings
        ];

        let allSelectedSeats = [];
        let allSelectedPO = [];
        let currentExpiringTenants = [];
        let pendingVisitsAcrossCollections = [];
        let currentMeetingRoomBookings = { pending: [], accepted: [], ongoing: [] };

        for (const config of collectionsToFetch) {
          const querySnapshot = await getDocs(collection(db, config.name));
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          if (config.setState) {
            config.setState(docs);
          }

          if (config.isTenant) {
            docs.forEach(tenant => {
              // Added check for tenant.status === "active"
              if (tenant.status === "active" && tenant.billing && tenant.billing.billingEndDate) {
                const daysRemaining = calculateDaysRemaining(tenant.billing.billingEndDate);
                if (daysRemaining !== null && daysRemaining <= 30 && daysRemaining >= 0) {
                  currentExpiringTenants.push({
                    ...tenant,
                    type: config.type,
                    daysRemaining: daysRemaining,
                    formattedEndDate: new Date(tenant.billing.billingEndDate.toDate ? tenant.billing.billingEndDate.toDate() : tenant.billing.billingEndDate).toLocaleDateString(),
                  });
                }
              }
            });
          }

          // Handle specific data extractions for cards/charts and pending visits
          if (config.name === "seatMap") {
            allSelectedSeats = docs.flatMap(doc =>
              doc.selectedSeats || []
            );
            setOccupiedSeats(allSelectedSeats);
            setAvailableSeats(totalSeats - allSelectedSeats.length);
          } else if (config.name === "privateOffice") {
            docs.forEach(office => {
              if (office.selectedPO) {
                if (Array.isArray(office.selectedPO)) {
                  allSelectedPO.push(...office.selectedPO);
                } else {
                  allSelectedPO.push(office.selectedPO);
                }
              }
            });
            setOccupiedPrivateOffices(allSelectedPO);
          } else if (["visitMap", "privateOfficeVisits", "virtualOfficeInquiry"].includes(config.name)) {
            const pending = docs.filter(visit => visit.status === "pending").map(visit => {
              let formattedDate = '';
              if (visit.date) {
                if (typeof visit.date.toDate === "function") {
                  formattedDate = visit.date.toDate().toLocaleDateString();
                } else {
                  formattedDate = typeof visit.date === 'string'
                    ? visit.date
                    : (visit.date instanceof Date
                      ? visit.date.toLocaleDateString()
                      : '');
                }
              }
              return {
                id: visit.id,
                ...visit,
                date: formattedDate,
                time: formatTime(visit.time),
                collection: config.name, // Add the collection name for later reference
                displayType: config.visitType // Add a display type for the UI
              };
            });
            pendingVisitsAcrossCollections.push(...pending);
          } else if (config.isMeetingRoom) {
            docs.forEach(booking => {
              let formattedDate = '';
              if (booking.date) {
                if (typeof booking.date.toDate === "function") {
                  formattedDate = booking.date.toDate().toLocaleDateString();
                } else {
                  formattedDate = typeof booking.date === 'string'
                    ? booking.date
                    : (booking.date instanceof Date
                      ? booking.date.toLocaleDateString()
                      : '');
                }
              }

              const bookingDetails = {
                id: booking.id,
                ...booking,
                date: formattedDate,
                startTime: formatTime(booking.from_time), // Using from_time
                endTime: formatTime(booking.to_time),     // Using to_time
              };

              if (booking.status === "pending") {
                currentMeetingRoomBookings.pending.push(bookingDetails);
              } else if (booking.status === "accepted") {
                currentMeetingRoomBookings.accepted.push(bookingDetails);
              } else if (booking.status === "ongoing") {
                currentMeetingRoomBookings.ongoing.push(bookingDetails);
              }
            });
          }
        }
        setExpiringTenants(currentExpiringTenants.sort((a, b) => a.daysRemaining - b.daysRemaining));
        setAllPendingVisits(pendingVisitsAcrossCollections); // Set the new state for all pending visits
        setVisitData(pendingVisitsAcrossCollections); // Keep this for existing visit data usage in charts/lists
        setMeetingRoomBookings(currentMeetingRoomBookings); // Set meeting room bookings

        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch dashboard data");
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };

    fetchAllData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [formatTime, calculateDaysRemaining]);


  // Fetch detailed visit information
  const fetchVisitDetails = async (visitId, collectionName) => {
    try {
      const visitDoc = await getDoc(doc(db, collectionName, visitId));
      if (visitDoc.exists()) {
        const visitData = visitDoc.data();
        let formattedDate = '';
        if (visitData.date) {
          if (typeof visitData.date.toDate === "function") {
            formattedDate = visitData.date.toDate().toLocaleDateString();
          } else {
            formattedDate = typeof visitData.date === 'string'
              ? visitData.date
              : (visitData.date instanceof Date
                ? visitData.date.toLocaleDateString()
                : '');
          }
        }

        setSelectedVisit({
          id: visitDoc.id,
          ...visitData,
          date: formattedDate,
          time: formatTime(visitData.time),
          collection: collectionName, // Pass collection name to modal
        });
        setShowVisitModal(true);
      }
    } catch (error) {
      console.error("Error fetching visit details:", error);
      setError("Failed to fetch visit details");
    }
  };

  // Prepare chart data
  const seatOccupancyData = [
    { name: 'Available', value: availableSeats },
    { name: 'Occupied', value: occupiedSeats.length },
  ];

  const visitByDate = {};
  visitData.forEach(visit => {
    if (visit.date) {
      visitByDate[visit.date] = (visitByDate[visit.date] || 0) + 1;
    }
  });
  const visitBarData = Object.entries(visitByDate).map(([date, value]) => ({
    date,
    "Pending Visits": value
  }));

  const totalPendingVisits = allPendingVisits.length; // Use allPendingVisits here

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading dashboard data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-red-800">Error Loading Dashboard</h3>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of workspace utilization and visitor management</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Live Data</span>
          <span className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Seats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Seats</p>
              <h3 className="mt-2 text-4xl font-semibold text-gray-900">{totalSeats}</h3>
              <p className="mt-1 text-sm text-gray-500">Across all workspaces</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <FaChair className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Available Seats */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Available</p>
              <h3 className="mt-2 text-4xl font-semibold text-green-600">{availableSeats}</h3>
              <p className="mt-1 text-sm text-gray-500">{Math.round((availableSeats / totalSeats) * 100)}% of capacity</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <HiOutlineUserAdd className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Occupied Seats */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Occupied</p>
              <h3 className="mt-2 text-4xl font-semibold text-red-600">{occupiedSeats.length}</h3>
              <p className="mt-1 text-sm text-gray-500">{Math.round((occupiedSeats.length / totalSeats) * 100)}% utilization</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <HiOutlineUserRemove className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Private Offices */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Private Offices</p>
              <h3 className="mt-2 text-4xl font-semibold text-purple-600">{occupiedPrivateOffices.length}</h3>
              <p className="mt-1 text-sm text-gray-500">{privateOfficeList.length} total offices</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <HiOutlineOfficeBuilding className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Seat Occupancy Pie Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Seat Occupancy</h2>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-gray-500">Available</span>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 ml-2"></span>
              <span className="text-xs text-gray-500">Occupied</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={seatOccupancyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="#34D399" stroke="#fff" strokeWidth={2} />
                  <Cell fill="#F87171" stroke="#fff" strokeWidth={2} />
                </Pie>
                <RechartsTooltip
                  formatter={(value, name) => [`${value} seats`, name]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '0.5rem'
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Requests Trend */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Visit Requests Trend</h2>
            <div className="flex items-center space-x-1 text-blue-600">
              <BsGraphUp className="w-5 h-5" />
              <span className="text-sm font-medium">Last 30 days</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '0.5rem'
                  }}
                  labelStyle={{ fontWeight: 500, color: '#111827' }}
                  formatter={(value) => [`${value} visits`, 'Pending Visits']}
                />
                <Bar
                  dataKey="Pending Visits"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Expiring Tenants Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Expiring Tenants (30 days or less)</h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {expiringTenants.length} expiring
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {expiringTenants.length > 0 ? (
            expiringTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="px-6 py-4 hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                        <HiOutlineCalendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{tenant.name || 'N/A'} - {tenant.company || 'N/A'}</h3>
                      <p className="text-sm text-gray-500">{tenant.type} Tenant</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 flex items-center">
                      <FaRegCalendarAlt className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      Ends: {tenant.formattedEndDate || 'N/A'}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.daysRemaining <= 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                      {tenant.daysRemaining} days left
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <HiOutlineCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants expiring soon</h3>
            </div>
          )}
        </div>
      </div>

      ---

      {/* --- Meeting Room Bookings Section (UI/UX Enhanced) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Meeting Room Bookings</h2>
        </div>

        <div className="p-6">
          <div className="flex border-b border-gray-200 mb-4">
            {['pending', 'accepted'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveMeetingRoomTab(status)}
                className={`py-2 px-4 text-sm font-medium capitalize border-b-2
                  ${activeMeetingRoomTab === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  focus:outline-none transition-colors duration-200`}
              >
                {status} ({meetingRoomBookings[status].length})
              </button>
            ))}
          </div>

          {/* Table for the active tab */}
          <div className="overflow-x-auto">
            {meetingRoomBookings[activeMeetingRoomTab].length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Booked By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Attendees
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetingRoomBookings[activeMeetingRoomTab].map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {booking.room || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.userName || booking.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.startTime} - {booking.endTime} {/* Using formatted startTime/endTime */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.guests || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <MdMeetingRoom className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No {activeMeetingRoomTab} bookings found.</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are currently no meeting room bookings with the status "{activeMeetingRoomTab}".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      ---

      {/* Pending Visits Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Visit Requests</h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {totalPendingVisits} pending
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {allPendingVisits.length > 0 ? (
            allPendingVisits.map((visit) => (
              <div
                key={`${visit.collection}-${visit.id}`}
                className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => fetchVisitDetails(visit.id, visit.collection)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <HiOutlineUserGroup className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{visit.name || 'Guest'}</h3>
                      <p className="text-sm text-gray-500">{visit.company || 'No company specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 flex items-center">
                      <FaRegCalendarAlt className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      {visit.date || 'N/A'}
                    </div>
                    {visit.time && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <HiOutlineClock className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        {visit.time}
                      </div>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {visit.displayType || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <MdOutlineEventNote className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending visits</h3>
              <p className="mt-1 text-sm text-gray-500">All visit requests have been processed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Visit Details Modal */}
      {showVisitModal && selectedVisit && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Visit Request Details</h3>
                <button
                  onClick={() => setShowVisitModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-y-4 gap-x-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Visitor Information</h4>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.name || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.email || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.phone || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.company || 'Not provided'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Visit Date</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.date || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Visit Time</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedVisit.time || 'Not specified'}</p>
                </div>

                {selectedVisit.host && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Host</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedVisit.host}</p>
                  </div>
                )}

                {selectedVisit.purpose && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Purpose of Visit</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedVisit.purpose}</p>
                  </div>
                )}

                {selectedVisit.additionalInfo && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Additional Information</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedVisit.additionalInfo}</p>
                  </div>
                )}

                {selectedVisit.collection && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Source Collection</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedVisit.collection}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Data refreshes automatically every 60 seconds. Last updated: {lastUpdated.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
