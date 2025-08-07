import React from "react";
import Image from "next/image";
import { Users2, CalendarCheck, Building2, Monitor, Wifi, Coffee } from "lucide-react";

const Meeting1 = () => {
  const meetingRooms = [
    {
      id: 1,
      name: "CORON",
      size: "9.10 SQM",
      capacity: "3-5 Pax",
      image: "/images/coron1.jpg",
      features: ["HD Monitor", "Whiteboard", "High-speed WiFi"]
    },
    {
      id: 2,
      name: "BORACAY",
      size: "17.56 SQM",
      capacity: "10-15 Pax",
      image: "/images/boracay1.jpg",
      features: ["Video Conferencing", "Projector", "Sound System"]
    },
    {
      id: 3,
      name: "EL NIDO",
      size: "27 SQM",
      capacity: "15-20 Pax",
      image: "/images/El_Nido1.jpg",
      features: ["Conference Phone", "Smart TV", "Catering Options"]
    },
    {
      id: 4,
      name: "SIARGAO",
      size: "68.68 SQM",
      capacity: "30-40 Pax",
      image: "/images/siargao2.jpg",
      features: ["Theater Setup", "Stage Area", "Full AV Support"]
    }
  ];

  const benefits = [
    {
      icon: <Monitor className="w-5 h-5 text-amber-600" />,
      title: "Tech-Ready",
      description: "Equipped with modern presentation tools"
    },
    {
      icon: <Wifi className="w-5 h-5 text-amber-600" />,
      title: "High-Speed Internet",
      description: "Fiber-optic connectivity throughout"
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-600" />,
      title: "Refreshments",
      description: "Complimentary coffee and water"
    },
    {
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
      title: "Prime Location",
      description: "Prestigious BGC business district"
    }
  ];

  return (
    <section className="w-full py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 mb-6 rounded-lg shadow-md">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Professional Meeting Spaces
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Host productive meetings in our well-equipped spaces, designed for collaboration and efficiency.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - Meeting Rooms */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {meetingRooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                {/* Room Image */}
                <div className="relative h-48">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">{room.name}</h3>
                    <p className="text-white/90 text-sm">{room.size} • {room.capacity}</p>
                  </div>
                </div>
                
                {/* Room Features */}
                <div className="p-6">
                  <ul className="space-y-2">
                    {room.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-300">
                    Book {room.name}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Benefits */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg mb-4">
                    <Users2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Why Choose Our Meeting Rooms</h3>
                </div>
                
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {benefit.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Meeting1;