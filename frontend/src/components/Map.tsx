const Map = () => {
  return (
    <div className="h-full bg-gray-100 rounded-lg shadow-inner flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mb-4">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          DC Ward Map
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Interactive map showing Washington DC's 8 wards with real-time sentiment and signal data.
          Map integration coming soon with Mapbox/Leaflet.
        </p>
        <div className="mt-6 grid grid-cols-4 gap-2 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((ward) => (
            <div
              key={ward}
              className="bg-white border border-gray-300 rounded p-2 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
            >
              Ward {ward}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Map;
