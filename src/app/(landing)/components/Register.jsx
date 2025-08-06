export default function ServcorpBanner() {
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=11th+Ave,+corner+36th+St,+Uptown+Bonifacio,+Bonifacio+Global+City+1634&zoom=16&size=1200x600&maptype=roadmap&markers=color:red|11th+Ave,+corner+36th+St,+Uptown+Bonifacio,+Bonifacio+Global+City+1634&key=AIzaSyCCkofkGxfEG_m9e2PmJPFtEu2veaZXX6g`;

  return (
    <div className="w-full h-auto flex flex-col md:flex-row bg-white">
      {/* Text Section */}
      <div className="w-full md:w-1/2 h-auto flex flex-col justify-center px-4 md:px-10 py-8 md:py-0 text-black order-2 md:order-1">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#c29554] text-center">
          Not an I-Hub client?
        </h2>
        <p className="mt-4 text-sm sm:text-base md:text-lg text-[#c29554] text-center px-2">
          Become part of a network of over 60,000 professionals. With offices and workspaces in 23 countries in some of the world's most prestigious locations.
        </p>
      </div>

      {/* Image Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:pr-6 order-1 md:order-2">
        <div
          className="w-full h-[250px] md:h-[350px] bg-cover bg-center rounded shadow-lg"
          style={{
            backgroundImage: `url('${mapUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
    </div>
  );
}