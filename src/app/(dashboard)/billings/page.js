import React from "react";

const billings = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-500">Welcome to your dashboard!</p>
      <div className="mt-4">
        <h2 className="text-2xl font-semibold">Your Stats</h2>
        <p className="text-gray-500">Here you can see your stats.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-xl font-semibold">Total Reservations</h3>
            <p className="text-gray-500">10</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-xl font-semibold">Total Earnings</h3>
            <p className="text-gray-500">$1000</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-xl font-semibold">Total Customers</h3>
            <p className="text-gray-500">50</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default billings;
