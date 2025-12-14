const Sidebar = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard</h2>

      {/* Stats Overview */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Overview</h3>
        <div className="space-y-3">
          <div className="bg-blue-50 rounded p-3">
            <div className="text-xs text-gray-600">Total Signals</div>
            <div className="text-2xl font-bold text-dc-blue">0</div>
          </div>
          <div className="bg-green-50 rounded p-3">
            <div className="text-xs text-gray-600">Positive</div>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          <div className="bg-yellow-50 rounded p-3">
            <div className="text-xs text-gray-600">Neutral</div>
            <div className="text-2xl font-bold text-yellow-600">0</div>
          </div>
          <div className="bg-red-50 rounded p-3">
            <div className="text-xs text-gray-600">Negative</div>
            <div className="text-2xl font-bold text-red-600">0</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Filters</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ward</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Wards</option>
              <option value="1">Ward 1</option>
              <option value="2">Ward 2</option>
              <option value="3">Ward 3</option>
              <option value="4">Ward 4</option>
              <option value="5">Ward 5</option>
              <option value="6">Ward 6</option>
              <option value="7">Ward 7</option>
              <option value="8">Ward 8</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sentiment</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Source Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Sources</option>
              <option value="twitter">Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="reddit">Reddit</option>
              <option value="nextdoor">Nextdoor</option>
              <option value="government">Government</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Sources */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Active Sources</h3>
        <div className="text-sm text-gray-500">
          No sources configured yet
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
