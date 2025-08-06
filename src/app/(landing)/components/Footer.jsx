"use client";
import React, { useState } from 'react';
import { FaEnvelope, FaInstagram, FaFacebookF, FaTiktok } from "react-icons/fa";
import ChatBot from 'react-simple-chatbot'; // Assuming this import is correct for your setup

const Footer = () => {
  const [showChatbot, setShowChatbot] = useState(false);

  const steps = [
    {
      id: 'greet',
      message: 'Hello! Welcome to Inspire Holdings. How can I help you today?',
      trigger: 'options'
    },
    {
      id: 'options',
      options: [
        { value: 'workspace', label: 'Workspace inquiries', trigger: 'workspace' },
        { value: 'meeting', label: 'Meeting room booking', trigger: 'meeting' },
        { value: 'contact', label: 'Contact support', trigger: 'contact' }
      ]
    },
    {
      id: 'workspace',
      message: 'For dedicated workspace inquiries, please email info@inspireholdings.ph',
      end: true
    },
    {
      id: 'meeting',
      message: 'To book meeting rooms, please visit our booking page inspirehub.com',
      end: true
    },
    {
      id: 'contact',
      message: 'Our Office is available Mon-Fri 7AM-10PM. Would you like us to contact you?',
      trigger: 'contact-response'
    },
    {
      id: 'contact-response',
      options: [
        { value: 'yes', label: 'Yes, please contact me', trigger: 'get-email' },
        { value: 'no', label: 'No, thanks', trigger: 'end' }
      ]
    },
    {
      id: 'get-email',
      message: 'Please enter your email address:',
      trigger: 'email-input'
    },
    {
      id: 'email-input',
      user: true,
      validator: (value) => {
        if (/^\S+@\S+\.\S+$/.test(value)) {
          return true;
        }
        return 'Please enter a valid email';
      },
      trigger: 'confirm-email'
    },
    {
      id: 'confirm-email',
      message: 'Thank you! We will contact you shortly.',
      end: true
    },
    {
      id: 'end',
      message: 'Thank you for chatting with us!',
      end: true
    }
  ];

  return (
    <footer className="bg-[#2b2b2b] text-[#d5ae85] px-4 py-12 md:px-8 lg:px-16">
      {/* Contact Section */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          {/* Email Contact */}
          <div className="md:w-1/2">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white">You may contact us via email at:</h3>
            <p className="text-base md:text-lg text-[#d5ae85] mb-2 hover:underline">info@inspireholdings.ph</p>
            <p className="text-base md:text-lg text-[#d5ae85] mb-2 hover:underline">inspirenextglobal@gmail.com</p>
          </div>

          {/* Office Hours */}
          <div className="md:w-1/2 md:border-l-2 border-[#d5ae85] md:pl-8">
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-white">Our Office Hours</h3>
            <p className="text-base md:text-lg text-[#d5ae85] mb-2 hover:underline">Monday to Friday: 7:00 AM - 06:30 PM</p>
            <p className="text-base md:text-lg text-[#d5ae85] mb-2 hover:underline">You may leave an email to us on Weekends!</p>
          </div>
        </div>
      </div>

      {/* --- */}

      {/* Footer Links and Social Icons */}
      <div className="flex flex-col md:flex-row md:justify-between items-center text-sm border-t border-[#333] pt-8 mt-10 md:mt-16">
        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6 md:mb-0 text-base md:text-sm">
          <a href="https://inspireholdings.ph/home" className="hover:underline hover:text-amber-500 transition-colors">Work</a>
          <a href="https://inspireholdings.ph/upcoming-projects" className="hover:underline hover:text-amber-500 transition-colors">Services</a>
          <a href="https://inspireholdings.ph/seminar-1" className="hover:underline hover:text-amber-500 transition-colors">Blog</a>
          <a href="https://inspireholdings.ph/home" className="hover:underline hover:text-amber-500 transition-colors">About</a>
        </div>

        {/* Company Names and Social Media */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 text-[#d5ae85]">
          {/* Inspire Holdings Inc. */}
          <div className="flex items-center space-x-3">
            <span className="text-base md:text-sm cursor-pointer hover:underline">Inspire Holdings Inc.</span>
            <a href="https://www.instagram.com/inspire.holdings.inc/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaInstagram />
            </a>
            <a href="https://web.facebook.com/inspireholdings" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaFacebookF />
            </a>
            <a href="https://www.tiktok.com/@inspire.holdings" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaTiktok />
            </a>
          </div>

          {/* Inspire Next Global Inc. */}
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <span className="text-base md:text-sm cursor-pointer hover:underline">Inspire Next Global Inc.</span>
            <a href="https://www.instagram.com/inspirenextglobal_inc/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaInstagram />
            </a>
            <a href="https://web.facebook.com/inspirenextglobalinc" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaFacebookF />
            </a>
            <a href="https://www.tiktok.com/@inspirenextglobal" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors text-xl">
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>

      {/* --- */}

      {/* Copyright and Chatbot */}
      <div className="relative text-center py-6 mt-10">
        <p className="text-xs md:text-sm text-gray-400">&copy; 2020–2025 Inspire Holdings Inc & Inspire Next Global Inc.</p>

      </div>
    </footer>
  );
};

export default Footer;