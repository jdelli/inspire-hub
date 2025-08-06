"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const carouselItems = [
  {
    id: 1,
    title: "Dedicated Desks",
    type: "desks",
    image: "/images/IMG_5320.jpg",
    description: "Enjoy a co-working environment tailored to meet the needs of freelancers, start-ups, and entrepreneurs."
  },
  {
    id: 2,
    title: "Meeting Rooms",
    type: "meetingroomlp",
    image: "/images/IMG_5330.jpg",
    description: "Professional meeting rooms available for hourly rental with premium amenities."
  },
  {
    id: 3,
    title: "Private Offices",
    type: "privateroom",
    image: "/images/IMG_5302.jpg",
    description: "Professionally furnished private offices available for lease in Uptown Bonifacio."
  },
];

const Page = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const router = useRouter();

  const goToSlide = (index) => {
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const goToNextSlide = () => {
    if (!isAnimating) {
      const nextIndex = (currentIndex + 1) % carouselItems.length;
      goToSlide(nextIndex);
    }
  };

  const goToPrevSlide = () => {
    if (!isAnimating) {
      const prevIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
      goToSlide(prevIndex);
    }
  };

  const handleBookNow = (item) => {
    if (item.type === "desks") {
      router.push("/client");
    }
    else if (item.type === "meetingroomlp") {
      router.push("/meetingroomlp");
    }
    else if (item.type === "privateroom") {
      router.push("/privateroom");
    }
    else {
      router.push("/booking"); // Default fallback
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        goToNextSlide();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, isAnimating, goToNextSlide]);

  return (
    <div className="relative w-full min-h-screen bg-gray-900 overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Main Content */}
      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:py-24">
        {/* Carousel Container */}
        <div className="w-full max-w-5xxl mx-auto rounded-x1 overflow-hidden shadow-2xxl">
          <div className="w-full h-auto min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
            {/* Slides */}
            {carouselItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/70 to-transparent flex flex-col justify-end p-6 sm:p-8 md:p-10">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[200px] h-[60px] sm:top-1 sm:w-[320px] sm:h-[320px] md:w-[500px] md:h-[400px] z-10">
                    <Image
                      src="/images/logogogo.png"
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="max-w-1xl mx-auto w-full">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-300 mb-2 font-serif">
                      {item.title}
                    </h2>
                    <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 font-serif">
                      {item.description}
                    </p>
                    <button
                      onClick={() => handleBookNow(item)}
                      className="px-6 py-2 sm:px-8 sm:py-3 bg-amber-500 hover:bg-red-500 text-white font-medium rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevSlide}
            // Removed: hidden sm:block
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-lg z-30 transition-colors duration-300"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNextSlide}
            // Removed: hidden sm:block
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full shadow-lg z-30 transition-colors duration-300"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-15 left-0 right-0 flex justify-center gap-2 z-30">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-amber-500 w-6' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to ${carouselItems[index].title}`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;