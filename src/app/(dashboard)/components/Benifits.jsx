import React from "react";
import { Package, Phone, MapPin, Star } from "lucide-react";

const Benefits = () => {
  const packages = [
    {
      id: 1,
      name: "COMMUNICATION",
      icon: Phone,
      benefits: [
        "Local phone number",
        "Dedicated Receptionist"
      ],
      price: "Php 3,000/Month"
    },
    {
      id: 2,
      name: "ADDRESS",
      icon: MapPin,
      benefits: [
        "Prestigious address",
        "Mail management",
        "Receive notifications for your mail and parcel",
        "Book all facilities online",
        "Assistance to corporate registration services"
      ],
      price: "Php 6,500/Month"
    },
    {
      id: 3,
      name: "PREMIUM",
      icon: Star,
      benefits: [
        "Prestigious address",
        "Mail management",
        "Receive notifications for your mail and parcel",
        "Book all facilities online",
        "Assistance to corporate registration services",
        "Free 4 days/month of use of private offices",
        "Free access to common areas"
      ],
      price: "Php 10,000/Month"
    }
  ];

  return (
    <section className="w-full py-16 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-12 gap-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg z-10">
            <Package className="w-10 h-10 text-white" />
          </div>
          <div className="bg-gray-200 border border-gray-400 rounded-lg px-8 py-4 -ml-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 uppercase tracking-wide">
              Benefits and Packages
            </h2>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-gray-200 border border-gray-400 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Package Header */}
              <div className="bg-gray-300 border border-gray-500 rounded-lg px-4 py-3 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <pkg.icon className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-bold text-gray-800">
                    {pkg.name}
                  </h3>
                </div>
              </div>

              {/* Benefits List */}
              <div className="space-y-3 mb-6">
                {pkg.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Separator */}
              <div className="border-t border-gray-400 mb-4"></div>

              {/* Price */}
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">
                  {pkg.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
