"use client";

import React from "react";

const services = [
  {
    title: "Dedicated Desks",
    image: "/images/IMG_5275.jpg",
    description:
      "Enjoy a personal, reserved workspace in a dynamic environment—perfect for focused productivity with the flexibility of a shared office.",
  
  },
  {
    title: "Meeting Rooms",
    image: "/images/IMG_5346.jpg",
    description:
      "Ideal for small teams, our private offices offer the perfect balance of privacy and community in a professional setting.",
    
  },
  {
    title: "Private Offices",
    image: "/images/IMG_5284.jpg",
    description:
      "Designed for growing teams, our medium offices provide ample space, premium amenities, and a collaborative atmosphere to help your business thrive.",
   
  },
  {
    title: "Virtual Office",
    image: "/images/virtual_office1.png ",
    description:
      "A virtual office provides businesses with a professional address, mail handling, and access to administrative support—without the cost of maintaining a physical workspace.",
   
  },
];

const Desks = () => {
  return (
    <div className="bg-gray-100 py-16 px-6 md:px-20">
      {/* Intro Section */}
      <div className="w-full md:w-2/3 mx-auto mb-16">
        <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
          Flexible Workspaces for Modern Professionals
        </h2>
        <p className="text-gray-700 text-lg leading-relaxed text-center">
          Whether you're a freelancer, a startup, or remote team, our beautifully furnished desks are ready to support your productivity.
          Enjoy a comfortable environment, and a vibrant community — all at an affordable rate.
        </p>
      </div>

      {/* Card Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden"
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">{service.title}</h3>
              <hr className="border-gray-200 mb-4" />
              <p className="text-gray-700 text-base leading-relaxed mb-6 flex-1">
                {service.description}
              </p>
            
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Desks;
