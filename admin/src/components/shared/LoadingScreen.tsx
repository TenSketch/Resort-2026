const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* Logo/Brand Image */}
      <div className="mb-8">
        <div className="relative">
          <img 
            src="https://res.cloudinary.com/dia8x6y6u/image/upload/v1752997496/logo_kszbod.png"
            alt="Vanavihari Logo"
            className="w-96 h-auto object-contain drop-shadow-lg"
          />
        </div>
      </div>

      {/* Brand Name */}
      <h1 className="text-5xl font-light text-gray-700 mb-16 tracking-wide">
        Vanavihari
      </h1>

      {/* Loading Bar */}
      <div className="w-80 h-1 bg-gray-300 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-loading-bar"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;