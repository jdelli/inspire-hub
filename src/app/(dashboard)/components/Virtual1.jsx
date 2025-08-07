import React from "react";
import { Building2, MapPin, Users, Globe, Phone, Mail, Clock, Shield } from "lucide-react";

const Virtual1 = () => {
  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-amber-600" />,
      title: "Prestigious Business Address",
      description: "Establish your company at our prime BGC location, enhancing your professional image without the overhead of physical office space.",
      highlight: "6F Alliance Global Tower, BGC"
    },
    {
      icon: <Phone className="w-6 h-6 text-amber-600" />,
      title: "Dedicated Phone Services",
      description: "Professional call answering and forwarding services with your local business number, ensuring you never miss important calls.",
      highlight: "Local +63 number included"
    },
    {
      icon: <Mail className="w-6 h-6 text-amber-600" />,
      title: "Mail Handling",
      description: "Secure mail reception and forwarding services, with optional scanning and digital delivery for your convenience.",
      highlight: "Mail forwarding available"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      title: "24/7 Access",
      description: "Access meeting rooms and services anytime"
    },
    {
      icon: <Shield className="w-5 h-5 text-amber-600" />,
      title: "Business Registration",
      description: "Valid address for SEC and DTI registration"
    },
    {
      icon: <Users className="w-5 h-5 text-amber-600" />,
      title: "Meeting Rooms",
      description: "Discounted access to professional spaces"
    },
    {
      icon: <Globe className="w-5 h-5 text-amber-600" />,
      title: "Global Presence",
      description: "Establish multiple locations worldwide"
    }
  ];

  return (
    <section className="w-full py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 mb-6 rounded-lg shadow-md">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Virtual Office Solutions
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Establish a professional business presence with our premium virtual office services, perfect for startups, remote teams, and expanding businesses.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 rounded-full text-sm font-medium">
                      {feature.highlight}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Benefits */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 sticky top-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg mb-4 mx-auto">
                    <Building2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Why Choose Our Virtual Office</h3>
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

export default Virtual1;