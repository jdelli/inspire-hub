'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const rooms = [
  {
    id: 1,
    label: 'Boracay',
    price: 2800,
    roomKey: 'boracay',
    landingPage: '/meetingroom?room=boracay',
    description: 'A cozy room perfect for small team meetings or individual work sessions. Features natural lighting and comfortable seating. Capacity: 9 - 12',
    images: [
      '/images/IMG_5296.jpg', // Main image for Boracay, also used for BG
      '/images/boracay1.jpg',
      '/images/boracay2.jpg',
    ],
  },
  {
    id: 2,
    label: 'Siargao',
    price: 11000,
    roomKey: 'siargao',
    landingPage: '/meetingroom?room=siargao',
    description: 'Our largest conference room, ideal for presentations, workshops, and large gatherings. Equipped with advanced A/V technology. Capacity: 50',
    images: [
      '/images/IMG_5338.jpg', // Main image for Siargao, also used for BG
      '/images/siargao2.jpg',
      '/images/siargao3.jpg',
    ],
  },
  {
    id: 3,
    label: 'El Nido',
    price: 4300,
    roomKey: 'elnido',
    landingPage: '/meetingroom?room=elnido',
    description: 'A versatile mid-sized room, great for brainstorming sessions or client meetings. Configurable layout options available. Capacity: 12 - 16',
    images: [
      '/images/IMG_5330.jpg', // Main image for El Nido, also used for BG
      '/images/El_Nido1.jpg',
      '/images/El_Nido2.jpg',
    ],
  },
  {
    id: 4,
    label: 'Coron',
    price: 1450,
    roomKey: 'coron',
    landingPage: '/meetingroom?room=coron',
    description: 'An intimate space designed for private calls, one-on-one meetings, or focused individual tasks. Quiet and professional. Capacity: 5',
    images: [
      '/images/IMG_5283.jpg', // Main image for Coron, also used for BG
      '/images/coron1.jpg',
      '/images/coron2.jpg',
    ],
  },
];

export default function RoomCarousel() {
  const router = useRouter();
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentRoom = rooms[currentRoomIndex];

  // Functions for navigating between rooms
  const goToNextRoom = () => {
    setCurrentRoomIndex((prevIndex) => (prevIndex + 1) % rooms.length);
    setCurrentImageIndex(0); // Reset image index when changing room
  };

  const goToPreviousRoom = () => {
    setCurrentRoomIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length);
    setCurrentImageIndex(0); // Reset image index when changing room
  };

  // Functions for navigating between images within the current room
  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % currentRoom.images.length);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + currentRoom.images.length) % currentRoom.images.length);
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center py-8 px-4 md:py-12 md:px-6">
      {/* Blurred Background Element */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${currentRoom.images[0]}')`,
          filter: 'blur(5px)',
          transform: 'scale(1.02)'
        }}
      ></div>

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Back Button */}
        <button
          onClick={() => router.push('/main')}
          className="absolute top-4 left-4 z-20 px-3 py-1 md:px-4 md:py-2 bg-black/60 text-white rounded-full text-xs md:text-sm font-semibold hover:bg-black/80 transition-colors duration-300 shadow-lg"
        >
          Back
        </button>

        <div className="relative w-full max-w-sm md:max-w-4xl h-auto md:h-[70vh] bg-white shadow-xl rounded-lg overflow-hidden flex flex-col md:flex-row my-auto">
          {/* Image Carousel Section */}
          <div className="relative w-full md:w-2/3 h-60 md:h-full overflow-hidden">
            <img
              src={currentRoom.images[currentImageIndex]}
              alt={`${currentRoom.label} image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
              key={currentRoom.id + '-' + currentImageIndex}
            />

            {/* Image Navigation Arrows */}
            {currentRoom.images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 md:p-2 rounded-full hover:bg-black/70 transition"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 md:p-2 rounded-full hover:bg-black/70 transition"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </>
            )}

            {/* Image Dots (Optional) */}
            {currentRoom.images.length > 1 && (
              <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-2">
                {currentRoom.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${
                      currentImageIndex === idx ? 'bg-white' : 'bg-gray-400 opacity-75'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Room Details Section */}
          <div className="w-full md:w-1/3 p-4 md:p-6 flex flex-col justify-between bg-white">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1 md:mb-2">{currentRoom.label}</h2>
              <p className="text-base md:text-lg text-gray-700 mb-2 md:mb-4">
                ₱{currentRoom.price.toLocaleString()} per hour
              </p>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                {currentRoom.description}
              </p>
            </div>
            <button
              onClick={() => router.push(currentRoom.landingPage)}
              className="w-full py-2 md:py-3 bg-blue-600 text-white rounded-md text-base md:text-lg font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Room Navigation Arrows (outside the card) */}
        <div className="flex justify-center space-x-4 mt-6 md:mt-8">
          <button
            onClick={goToPreviousRoom}
            className="bg-black/60 text-white p-2 md:p-3 rounded-full hover:bg-black/80 transition shadow-lg"
            aria-label="Previous room"
          >
            <ChevronLeftIcon className="h-6 w-6 md:h-8 md:w-8" />
          </button>
          <button
            onClick={goToNextRoom}
            className="bg-black/60 text-white p-2 md:p-3 rounded-full hover:bg-black/80 transition shadow-lg"
            aria-label="Next room"
          >
            <ChevronRightIcon className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}