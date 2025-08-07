"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Meeting1 from "../components/Meeting1";
import Virtual1 from "../components/Virtual1";
import Benifits from "../components/Benifits";

const carouselItems = [
  // {
  //   id: 1,
  //   title: "Dedicated Desks",
  //   type: "desks",
  //   image: "/images/IMG_5320.jpg",
  //   description: "Enjoy a co-working environment tailored to meet the needs of freelancers, start-ups, and entrepreneurs."
  // },
  {
    id: 2,
    title: "Meeting Rooms",
    type: "meetingroomlp",
    image: "/images/IMG_5330.jpg",
    description: "Professional meeting rooms available for hourly rental with premium amenities."
  },
  {
    id: 3,
    title: "Virtual Office",
    type: "privateroom",
    image: "/images/IMG_5302.jpg",
    description: "Our virtual offices are ideal for businesses everywhere in the world."
  },
];

const Page = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(isAnimating);

  const router = useRouter();

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const goToSlide = (index) => {
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const goToNextSlide = () => {
    if (!isAnimatingRef.current) {
      const nextIndex = (currentIndex + 1) % carouselItems.length;
      goToSlide(nextIndex);
    }
  };

  const goToPrevSlide = () => {
    if (!isAnimatingRef.current) {
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
      router.push("/virtual");
    }
    else {
      router.push("/booking"); // Default fallback
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimatingRef.current) {
        goToNextSlide();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  return (
    <div className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Carousel Section */}
      <section className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:py-24">
        {/* Carousel Container */}
        <div className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden border border-white/10">
          <div className="w-full h-auto min-h-[500px] sm:min-h-[600px] md:min-h-[700px]">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent flex flex-col justify-center items-center p-8 sm:p-12 md:p-16">
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[180px] h-[54px] sm:w-[280px] sm:h-[280px] md:w-[400px] md:h-[320px] z-10">
                    <Image
                      src="/images/logogogo.png"
                      alt="Company Logo"
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="text-center max-w-5xl mx-auto w-full flex flex-col items-center justify-center min-h-[400px]">
                    <div className="mb-12">
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-amber-300 mb-6 font-serif drop-shadow-lg">
                        {item.title}
                      </h2>
                      <p className="text-white/95 text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed max-w-4xl mx-auto">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBookNow(item)}
                      className="group relative px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg sm:text-xl rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-amber-400/30 shadow-lg hover:shadow-xl"
                    >
                      <span className="relative z-10">Book Now</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Previous Button */}
          <button
            onClick={goToPrevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full border border-white/20 backdrop-blur-sm z-30 transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={goToNextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full border border-white/20 backdrop-blur-sm z-30 transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-30">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 border-2 border-white/50 hover:border-white/80 ${
                  index === currentIndex 
                    ? 'bg-amber-500 border-amber-500 w-8' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to ${carouselItems[index].title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Virtual Office Section */}
      <Meeting1 />
      <Virtual1 />
      <Benifits />
     
    </div>
  );
};

export default Page;