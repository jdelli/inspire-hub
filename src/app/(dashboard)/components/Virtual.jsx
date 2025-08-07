"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { db } from "../../../../script/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { sendVirtualOfficeInquiryEmail } from "../../(admin)/utils/email";
import { 
  Building2, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  CheckCircle, 
  Star,
  Shield,
  Wifi,
  Users,
  MapPin,
  ChevronRight
} from "lucide-react";

const DETAILS = [
  {
    title: "Your Address",
    desc: "Your address becomes 6F Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila – to use on your website and business collateral. A great address should improve your SEO rankings.",
    icon: MapPin,
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "Local Phone Number",
    desc: "Local phone number with dedicated receptionists to answer your calls the way you would like and extend them to you wherever you are.",
    icon: Phone,
    color: "from-green-500 to-green-600"
  },
  {
    title: "On-Site Support",
    desc: "Secretaries and in-house IT support team available to assist your business on-site.",
    icon: Users,
    color: "from-purple-500 to-purple-600"
  },
  {
    title: "Meeting Rooms",
    desc: "Fully equipped meeting rooms, video conferencing and boardrooms – your clients will be impressed.",
    icon: Building2,
    color: "from-orange-500 to-orange-600"
  },
  {
    title: "Mobile Business Phone",
    desc: "Take your business phone on your mobile anywhere outside your home location.",
    icon: Phone,
    color: "from-indigo-500 to-indigo-600"
  },
  {
    title: "Super Fast Wifi",
    desc: "Super fast, secure Wifi.",
    icon: Wifi,
    color: "from-teal-500 to-teal-600"
  },
];

const BookSeatsForm = () => {
  const [form, setForm] = useState({
    name: "",
    date: "",
    phone: "",
    email: "",
    company: "",
    position: "",
  });

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY);
    } else {
      console.warn("EmailJS public key not set. Email sending may not work.");
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, "virtualOfficeInquiry"), {
        ...form,
        timestamp: new Date(),
        status: "pending",
        requestDate: serverTimestamp(),
      });

      await sendVirtualOfficeInquiryEmail(form);
      setSuccess(true);
      setForm({
        name: "",
        phone: "",
        email: "",
        company: "",
        position: "",
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting booking or sending email:", error);
      alert("Error submitting inquiry or sending email. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
        <Link
          href="/main"
            className="inline-flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-all duration-200 mb-6 group"
          >
            <div className="p-3 rounded-lg bg-white/80 mt-15 backdrop-blur-sm group-hover:bg-white  border border-gray-200/50">
              <FiArrowLeft size={20} />
            </div>
           <span className="font-semibold mt-15 text-lg">Back to Dashboard</span> 
        </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent">
              Virtual Office
            </h1>
            <p className="text-gray-600 text-xl max-w-4xl mx-auto leading-relaxed mb-6">
              Professional business address and support services for your growing enterprise
            </p>
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-50 to-red-50 p-8 border border-orange-200/50">
              <div className="text-center space-y-4">
                <p className="text-gray-700 text-lg leading-relaxed">
                  I-Hub's Virtual Office solutions equip your business with the essential tools to thrive. Establish a strong presence with a prestigious 5-star business address, a local phone number, dedicated receptionist services, and comprehensive corporate registration support.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                  With an I-Hub Virtual Office, you can project the image and enjoy the operational support of a well-established global company—quickly, seamlessly, and at a fraction of the traditional cost.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Features Section */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 p-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">What You Get</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {DETAILS.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={item.title} className="group">
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200/50 transition-all duration-300 transform hover:-translate-y-1">
                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg mb-4`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 p-12">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 shadow-lg rounded-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Inquiry Form</h2>
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
              onChange={handleChange}
              required
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
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
              onChange={handleChange}
              required
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
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
                          type="tel"
                          name="phone"
                          value={form.phone}
              onChange={handleChange}
              required
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
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
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
                          placeholder="Enter your company name"
            />
                      </div>
          </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="position">
                        Position
            </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                          id="position"
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
                          placeholder="Enter your position"
            />
          </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="date">
                        Preferred Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          id="date"
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={handleChange}
                          className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-white/50 backdrop-blur-sm rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:from-orange-600 hover:via-red-600 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-lg">Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <CheckCircle className="w-6 h-6" />
                      <span>Submit Inquiry</span>
                    </div>
                  )}
          </button>

          {/* Success Message */}
          {success && (
                  <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 text-lg">Inquiry Submitted Successfully!</h4>
                        <p className="text-green-700">We'll get back to you within 24 hours.</p>
                      </div>
                    </div>
            </div>
          )}
        </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSeatsForm;