const Header = () => {
  return (
    <header className="bg-dc-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold">DC Community Pulse</div>
            <div className="hidden md:block text-sm text-gray-300">
              Real-time Community Intelligence Dashboard
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-300">Status:</span>
              <span className="ml-2 inline-flex items-center">
                <span className="h-2 w-2 bg-green-400 rounded-full mr-1"></span>
                <span className="text-green-400">Live</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
